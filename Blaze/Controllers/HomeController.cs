using System;
using System.Collections.Specialized;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Net;
using System.Web.Mvc;
using Blaze.Models;

namespace Blaze.Controllers
{
    public class HomeController : Controller
    {
        //
        // GET: /Home/

        public ActionResult Index(string accountName)
        {
            ViewBag.AccountName = accountName;
            var emojis = ConfigurationManager.GetSection("emojis") as NameValueCollection;
            var model = new HomeModel
                            {
                                Emojis = (from e in emojis.AllKeys
                                          select new Emoji {Name = e, ImageUrl = emojis[e]})
                            };
            return View(model);
        }

        public ActionResult Old(string accountName)
        {
            ViewBag.AccountName = accountName;
            var emojis = ConfigurationManager.GetSection("emojis") as NameValueCollection;
            var model = new HomeModel
            {
                Emojis = (from e in emojis.AllKeys
                          select new Emoji { Name = e, ImageUrl = emojis[e] })
            };
            return View(model);
        }

        public ActionResult Test()
        {
            return View();
        }

        public ActionResult Proxy(string account, string url)
        {
            var request = (HttpWebRequest) WebRequest.Create(string.Format("https://{0}.campfirenow.com/{1}?{2}", account, url, Request["QUERY_STRING"]));
            request.Method = Request.HttpMethod;
            request.ContentType = Request.ContentType;
            request.ContentLength = Request.ContentLength;
            request.Headers["Authorization"] = Request.Headers["Authorization"];
            request.Accept = Request.Headers["Accept"];

            if (Request.HttpMethod == "POST" || Request.HttpMethod == "PUT")
            {
                var inStream = Request.InputStream;
                var outStream = request.GetRequestStream();
                inStream.CopyTo(outStream);
                outStream.Close();
            }
            var response = (HttpWebResponse) request.GetResponse();
            Response.StatusCode = (int) response.StatusCode;
            return new FileStreamResult(response.GetResponseStream(), response.ContentType);
        }

        public ActionResult Recent(string account, string url)
        {
            var request = (HttpWebRequest)WebRequest.Create(string.Format("https://{0}.campfirenow.com/{1}?{2}", account, url, Request["QUERY_STRING"]));
            request.Method = "GET";
            request.ContentType = "application/json";
            request.Headers["Authorization"] = Request.Headers["Authorization"];
            var response = (HttpWebResponse)request.GetResponse();
            var reader = new StreamReader(response.GetResponseStream());
            var data = reader.ReadToEnd();
            dynamic obj = Newtonsoft.Json.JsonConvert.DeserializeObject(data);
            var processor = new MessageProcessor();
            foreach(var msg in obj.messages)
            {
                msg.parsed_body = processor.ProcessMessage(Convert.ToString(msg.body));
            }
            string result = Newtonsoft.Json.JsonConvert.SerializeObject(obj);
            return Content(result, "application/json");
        }
    }
}
