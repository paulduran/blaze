using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Runtime.Serialization;
using System.Text;
using System.Web;
using System.Web.Mvc;

namespace Blaze.Controllers
{
    public class HomeController : Controller
    {
        //
        // GET: /Home/
        private const string accountName = "freshview";

        public ActionResult Index()
        {
            Response.AddHeader("Access-Control-Allow-Origin", "https://freshview.campfirenow.com");
            return View();
        }

        public ActionResult Login(string username, string password)
        {
            var user = Get<User>(CreateAuthToken(username,password), "users/me.xml");                        
            if( user != null )
                Response.SetCookie(new HttpCookie("auth-token", user.ApiAuthToken));
            return Json(user);
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

        private string CreateAuthToken(string username, string password)
        {
            var bytesToEncode = Encoding.ASCII.GetBytes(username + ":" + password);
                return Convert.ToBase64String(bytesToEncode);
        }

        private T Get<T>(string authorization, string action)
        {
            var request = (HttpWebRequest) WebRequest.Create(string.Format("https://{0}.campfirenow.com/{1}", accountName, action));
            request.Method = "GET";
            request.Headers[HttpRequestHeader.Authorization] = string.Format("Basic {0}", authorization);
            request.Accept = "application/xml";
            var response = request.GetResponse();
            var serializer = new DataContractSerializer(typeof(T));
            return (T)serializer.ReadObject(response.GetResponseStream());
        }
/*
        private HttpWebRequest CreateRequest(string action, string method)
        {
            /* var request = (HttpWebRequest) WebRequest.Create(string.Format("http{3}://{0}.campfirenow.com/room/{1}/{2}.xml", accountName, roomId, action, isHttps ? "s" : ""));
            request.Method = method;
            request.Headers[HttpRequestHeader.Authorization] = string.Format("Basic {0}", EncodedAuthToken);
            request.Accept = "application/xml";
            return request;
        }*/
    }

    [DataContract(Name="user", Namespace="")]
    public class User
    {
        [DataMember(Name="id")]
        public int Id { get; set; }
        [DataMember(Name="name")]
        public string Name { get; set; }
        [DataMember(Name="email-address")]
        public string EmailAddress { get; set; }
        [DataMember(Name="admin")]
        public bool IsAdmin { get; set; }
        [DataMember(Name="created-at")]
        public DateTime CreatedAt { get; set; }
        [DataMember(Name="type")]
        public string Type { get; set; }
        [DataMember(Name="avatar-url")]
        public string AvatarUrl { get; set; }
        [DataMember(Name="api-auth-token")]
        public string ApiAuthToken { get; set; }
    }
}
