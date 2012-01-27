using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Configuration;
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
        private const string accountName = "freshview";

        public ActionResult Index()
        {
            var emojis = ConfigurationManager.GetSection("emojis") as NameValueCollection;
            var model = new HomeModel
                            {
                                Emojis = (from e in emojis.AllKeys
                                          select new Emoji {Name = e, ImageUrl = emojis[e]})
                            };
            return View(model);
        }

        public ActionResult Proxy(string url)
        {
            var request = (HttpWebRequest) WebRequest.Create(string.Format("https://{0}.campfirenow.com/{1}?{2}", accountName, url, Request["QUERY_STRING"]));
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
    }
}
