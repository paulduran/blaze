using Newtonsoft.Json;
using NLog;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Mvc;

namespace Blaze.Controllers
{
    public interface ICommandWrapper
    {
        bool Match(string url);
        string ProcessContent(HttpRequestBase request, string ipAddress, string accountName, string content);
    }

    public class LoginLoggingCommandWrapper : ICommandWrapper
    {
        private static readonly Logger Log = LogManager.GetLogger("Blaze.Login");

        public bool Match(string url)
        {
            return url == "users/me.json";
        }

        public string ProcessContent(HttpRequestBase request, string ipAddress, string accountName, string content)
        {            
            dynamic obj = Newtonsoft.Json.JsonConvert.DeserializeObject(content);
            Log.Info("login on account: {0}. email: {1}. IP: {2}. Agent: {3}", accountName,
                     obj.user != null ? obj.user.email_address : "(unknown)", 
                     ipAddress, request.UserAgent);
            return content;
        }
    }

    public class HomeController : Controller
    {
        private readonly IList<ICommandWrapper> commandWrappers;
        private static readonly Logger Log = LogManager.GetCurrentClassLogger();
        private readonly OAuthService oAuthService;
        private static readonly Regex r = new Regex("https?://(.*?)\\.campfirenow");
        private readonly bool offline;

        public HomeController(IList<ICommandWrapper> commandWrappers)
        {
            this.commandWrappers = commandWrappers;
            oAuthService = new OAuthService();
            offline = Convert.ToBoolean(ConfigurationManager.AppSettings["app:offline"] ?? "false"); 
         }

        public HomeController()
        {
            commandWrappers = new List<ICommandWrapper>() {new LoginLoggingCommandWrapper()};
            oAuthService = new OAuthService();
            offline = Convert.ToBoolean(ConfigurationManager.AppSettings["app:offline"] ?? "false"); 
        }

        public ActionResult Index()
        {
            var authUrl = oAuthService.GetLoginUrl();
            ViewBag.LoginUrl = authUrl;
            ViewBag.Offline = offline;                                 
            Log.Info("Home Page Visitor. Referrer: {0}, IP Address: {1}. Agent: {2}", Request.UrlReferrer, GetIPAddress(Request), Request.UserAgent);
            return View();
        }

        //
        // GET: /Home/
        [AuthActionFilter]
        public ActionResult Chat(string accountName, string code, string auth)
        {
            var info = oAuthService.GetInfo(auth);
            Log.Info("Info received from auth: {0}", JsonConvert.SerializeObject(info));
            switch( info.Accounts.Count(x=>x.Product == "campfire"))
            {
                case 0:
                    Log.Info("No Campfire accounts. Info received from auth: {0}", JsonConvert.SerializeObject(info));
                    return View("NoCampfireAccounts");
                default:
                    ViewBag.Accounts = info.Accounts.Where(x => x.Product == "campfire").Select(GetAccountName);
                    break;
            }

            ViewBag.Stealth = Convert.ToBoolean(ConfigurationManager.AppSettings["Stealth"] ?? "true")
                                  ? "true"
                                  : "false";
            return View("Chat");
        }

        private static string GetAccountName(Account account)
        {
            string accountName = null;
            var match = r.Match(account.Href);
            if (match.Success)
                accountName = match.Groups[1].Value;
            return accountName;
        }

        public ActionResult LaunchpadCallback(string code)
        {
            if (!string.IsNullOrEmpty(code))
            {
                var message = "trying with code " + code + ".\n";
                try
                {
                    var reply = oAuthService.GetTokens(code);
                    oAuthService.AssignCookies(reply, Response);
                    return RedirectToAction("Chat");
                }
                catch (Exception ex)
                {
                    Log.FatalException("unable to retrieve oauth tokens", ex);
                    message += ex.ToString();
                    ViewBag.Message = message;
                    return View("Error");
                }
            }
            return RedirectToAction("Index");
        }

        [AuthActionFilter]
        public ActionResult Proxy(string account, string url, string auth)
        {
            string fullUrl = string.Format("https://{0}.campfirenow.com/{1}?{2}", account, url, Request["QUERY_STRING"]);
            var request = (HttpWebRequest) WebRequest.Create(fullUrl);
            request.Method = Request.HttpMethod;
            request.ContentType = Request.ContentType;
            request.ContentLength = Request.ContentLength;

            if (!string.IsNullOrEmpty(auth))
                request.Headers["Authorization"] = "Bearer " + auth;
            request.Accept = Request.Headers["Accept"];

            if (Request.HttpMethod == "POST" || Request.HttpMethod == "PUT")
            {
                var inStream = Request.InputStream;
                var outStream = request.GetRequestStream();
                inStream.CopyTo(outStream);
                outStream.Close();
            }
            try
            {
                var response = (HttpWebResponse) request.GetResponse();
                Response.StatusCode = (int) response.StatusCode;
                var reader = new StreamReader(response.GetResponseStream());
                var data = reader.ReadToEnd();
                data = commandWrappers
                    .Where(commandWrapper => commandWrapper.Match(url))
                    .Aggregate(data, (current, commandWrapper) => commandWrapper.ProcessContent(Request,GetIPAddress(Request), account, current));
                return Content(data, response.ContentType);
            } catch (WebException ex)
            {
                return HandleWebException(fullUrl, ex);
            }
        }

        private static string GetIPAddress(HttpRequestBase request)
        {
            string ip = request.ServerVariables["HTTP_X_FORWARDED_FOR"];
            if (!String.IsNullOrEmpty(ip))
            {
                // sometimes HTTP_X_FORWARDED_FOR returns multiple IP's
                string[] ipRange = ip.Split(',');
                ip = ipRange[ipRange.Length - 1];
            }
            else
                ip = request.ServerVariables["REMOTE_ADDR"];
            return ip;
        }

        public ActionResult Force(int val)
        {
            var httpCookie = new HttpCookie("BlazeForce", val.ToString());
            httpCookie.Expires = DateTime.Now.AddDays(1);
            Response.Cookies.Add(httpCookie);
            return Content("OK");
        }

        [AuthActionFilter]
        public ActionResult Recent(string account, string url, string auth)
        {
            if (offline)
            {
                var cookie = Request.Cookies["BlazeForce"];
                if( cookie == null || cookie.Value != "1")
                    return View("Offline");
            }
            string fullUrl = string.Format("https://{0}.campfirenow.com/{1}?{2}", account, url, Request["QUERY_STRING"]);
            var request = (HttpWebRequest)WebRequest.Create(fullUrl);
            request.Method = "GET";
            request.ContentType = "application/json";
            request.Headers["Authorization"] = "Bearer " + auth;
            try
            {
                var response = (HttpWebResponse) request.GetResponse();
                var reader = new StreamReader(response.GetResponseStream());
                var data = reader.ReadToEnd();
                dynamic obj = Newtonsoft.Json.JsonConvert.DeserializeObject(data);
                var processor = new MessageProcessor();
                foreach (var msg in obj.messages)
                {
                    msg.parsed_body = processor.ProcessMessage(Convert.ToString(msg.body));
                }
                string result = Newtonsoft.Json.JsonConvert.SerializeObject(obj);
                return Content(result, "application/json");
            }
            catch (WebException ex)
            {
                return HandleWebException(fullUrl,ex);
            }
        }

        private ActionResult HandleWebException(string fullUrl, WebException ex)
        {
            if (ex.Response == null)
            {
                Log.ErrorException(string.Format("Web Exception received requesting URL: {0}", fullUrl), ex);
                Response.StatusCode = 503;
                return null;
            }
            var response = ((HttpWebResponse) ex.Response);
            Response.StatusCode = (int) response.StatusCode;
            Log.ErrorException(string.Format("Response Code : {0} received requesting URL: {1}", response.StatusCode, fullUrl), ex);
            return new FileStreamResult(response.GetResponseStream(), response.ContentType);
        }

        [AuthActionFilter]
        public ActionResult GetFile(string account, string auth, string url)
        {
            string fullUrl = string.Format("https://{0}.campfirenow.com/{1}?{2}", account, url, Request["QUERY_STRING"]);
            var filename = url.Substring(url.LastIndexOf('/')+1);
            var request = (HttpWebRequest)WebRequest.Create(fullUrl);
            request.Method = "GET";
            request.Headers["Authorization"] = "Bearer " + auth;
            try
            {
                var response = request.GetResponse();
                return File(response.GetResponseStream(), response.ContentType, filename);
            } catch (WebException ex)
            {
                return HandleWebException(fullUrl, ex);
            }
        }
    }

    public class LaunchpadTokens
    {
        public int ExpiresIn { get; set; }
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
    }
}
