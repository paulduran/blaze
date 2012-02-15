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
        //
        // GET: /Home/

        public ActionResult Index(string accountName)
        {
            ViewBag.AccountName = accountName;
            ViewBag.Stealth = Convert.ToBoolean(ConfigurationManager.AppSettings["Stealth"] ?? "true")
                                  ? "true"
                                  : "false";
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

        [HttpPost]
        public ActionResult Upload(string account, string auth, string roomId)
        {
            var file = Request.Files["upload"];
            if (file == null) return Json(false);

            //file.SaveAs(@"C:\temp\" + file.FileName);
            string url = string.Format("https://{0}.campfirenow.com/room/{1}/upload.xml", account, roomId);

            HttpUploadFile(url, file, "upload", "application/octet-stream", auth);
            return Json(true);
        }

        public static void HttpUploadFile(string url, HttpPostedFileBase file, string paramName, string contentType, string auth)
        {
            string boundary = "---------------------------" + DateTime.Now.Ticks.ToString("x");
            byte[] boundarybytes = System.Text.Encoding.ASCII.GetBytes("\r\n--" + boundary + "\r\n");

            HttpWebRequest wr = (HttpWebRequest)WebRequest.Create(url);
            wr.Headers["Authorization"] = "Basic  " + auth;
            wr.ContentType = "multipart/form-data; boundary=" + boundary;
            wr.Method = "POST";
            wr.KeepAlive = true;

            Stream rs = wr.GetRequestStream();
//
//            string formdataTemplate = "Content-Disposition: form-data; name=\"{0}\"\r\n\r\n{1}";
//            foreach (string key in nvc.Keys)
//            {
//                rs.Write(boundarybytes, 0, boundarybytes.Length);
//                string formitem = string.Format(formdataTemplate, key, nvc[key]);
//                byte[] formitembytes = System.Text.Encoding.UTF8.GetBytes(formitem);
//                rs.Write(formitembytes, 0, formitembytes.Length);
//            }
            rs.Write(boundarybytes, 0, boundarybytes.Length);

            string headerTemplate = "Content-Disposition: form-data; name=\"{0}\"; filename=\"{1}\"\r\nContent-Type: {2}\r\n\r\n";
            string header = string.Format(headerTemplate, paramName, file, contentType);
            byte[] headerbytes = System.Text.Encoding.UTF8.GetBytes(header);
            rs.Write(headerbytes, 0, headerbytes.Length);

            var fileStream = file.InputStream;
            byte[] buffer = new byte[4096];
            int bytesRead = 0;
            while ((bytesRead = fileStream.Read(buffer, 0, buffer.Length)) != 0)
            {
                rs.Write(buffer, 0, bytesRead);
            }
            fileStream.Close();

            byte[] trailer = System.Text.Encoding.ASCII.GetBytes("\r\n--" + boundary + "--\r\n");
            rs.Write(trailer, 0, trailer.Length);
            rs.Close();

            WebResponse wresp = null;
            try
            {
                wresp = wr.GetResponse();
//                Stream stream2 = wresp.GetResponseStream();
//                StreamReader reader2 = new StreamReader(stream2);
//                log.Debug(string.Format("File uploaded, server response is: {0}", reader2.ReadToEnd()));
            }
            catch (Exception ex)
            {
//                log.Error("Error uploading file", ex);
                if (wresp != null)
                {
                    wresp.Close();
                    wresp = null;
                }
            }
            finally
            {
                wr = null;
            }
        }
    }
}
