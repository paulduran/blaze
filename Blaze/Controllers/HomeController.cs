using System;
using System.Collections.Specialized;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using Blaze.Models;

namespace Blaze.Controllers
{
    [RequireHttpsAttribute]
    public class HomeController : Controller
    {
        public ActionResult Public()
        {
            return View();
        }
        //
        // GET: /Home/

        public ActionResult Index(string accountName)
        {
            ViewBag.AccountName = accountName;
            ViewBag.Stealth = Convert.ToBoolean(ConfigurationManager.AppSettings["Stealth"] ?? "true")
                                  ? "true"
                                  : "false";
            var model = new HomeModel
                            {
                            };
            return View(model);
        }

        public ActionResult Proxy(string account, string url, string auth)
        {
            string fullUrl = string.Format("https://{0}.campfirenow.com/{1}?{2}", account, url, Request["QUERY_STRING"]);
            var request = (HttpWebRequest) WebRequest.Create(fullUrl);
            request.Method = Request.HttpMethod;
            request.ContentType = Request.ContentType;
            request.ContentLength = Request.ContentLength;
            if (!string.IsNullOrEmpty(auth))
                request.Headers["Authorization"] = "Basic  " + auth;
            else
                request.Headers["Authorization"] = Request.Headers["Authorization"];
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
                return new FileStreamResult(response.GetResponseStream(), response.ContentType);
            } catch (WebException ex)
            {
                return HandleWebException(ex);
            }
        }

        public ActionResult Recent(string account, string url)
        {
            string fullUrl = string.Format("https://{0}.campfirenow.com/{1}?{2}", account, url, Request["QUERY_STRING"]);
            var request = (HttpWebRequest)WebRequest.Create(fullUrl);
            request.Method = "GET";
            request.ContentType = "application/json";
            request.Headers["Authorization"] = Request.Headers["Authorization"];
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
                return HandleWebException(ex);
            }
        }

        private ActionResult HandleWebException(WebException ex)
        {
            if (ex.Response == null)
            {
                Response.StatusCode = 503;
                return null;
            }
            var response = ((HttpWebResponse) ex.Response);
            Response.StatusCode = (int) response.StatusCode;
            return new FileStreamResult(response.GetResponseStream(), response.ContentType);
        }

        public ActionResult GetFile(string account, string auth, string url)
        {
            string fullUrl = string.Format("https://{0}.campfirenow.com/{1}?{2}", account, url, Request["QUERY_STRING"]);
            var request = (HttpWebRequest)WebRequest.Create(fullUrl);
            request.Method = "GET";
            request.Headers["Authorization"] = "Basic  " + auth;
            try
            {
                var response = request.GetResponse();
                return new FileStreamResult(response.GetResponseStream(), response.ContentType);
            } catch (WebException ex)
            {
                return HandleWebException(ex);
            }
        }
    }
}
