using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Runtime.Serialization;
using System.Text;
using System.Web;
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
            var auth = Request.Headers[HttpRequestHeader.Authorization.ToString()];
            var request = (HttpWebRequest) WebRequest.Create(string.Format("https://{0}.campfirenow.com/{1}", accountName, url));
            request.Method = "GET";
            request.Headers[HttpRequestHeader.Authorization] = auth;
            request.Accept = "application/xml";
            var response = request.GetResponse();
            return new FileStreamResult(response.GetResponseStream(), "application/xml");
        }
    }
}
