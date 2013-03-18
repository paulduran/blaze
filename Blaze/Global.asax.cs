using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using Blaze.App_Start;
using NLog;

namespace Blaze
{
    // Note: For instructions on enabling IIS6 or IIS7 classic mode, 
    // visit http://go.microsoft.com/?LinkId=9394801

    public class MvcApplication : System.Web.HttpApplication
    {
        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
            filters.Add(new HandleErrorAttribute());
        }

        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );

            routes.MapRoute(
                "chat_route", // Route name
                "chat", // URL with parameters
                new { controller = "Home", action = "Chat" } // Parameter defaults
            );


            routes.MapRoute(
                "get_upload_route", // Route name
                "uploads/{account}/{*url}", // URL with parameters
                new { controller = "Home", action = "GetFile" } // Parameter defaults
            );

            routes.MapRoute(
                "proxy_route", // Route name
                "x/{account}/{*url}", // URL with parameters
                new { controller = "Home", action = "Proxy" } // Parameter defaults
            );

            routes.MapRoute(
               "getfile_route", // Route name
               "f/{account}/{*url}", // URL with parameters
               new { controller = "Home", action = "GetFile" } // Parameter defaults
           );


            routes.MapRoute(
                "recent_route", // Route name
                "recent/{account}/{*url}", // URL with parameters
                new { controller = "Home", action = "Recent" } // Parameter defaults
            );

            routes.MapRoute(
                "search_route", // Route name
                "search/{account}/{*url}", // URL with parameters
                new { controller = "Home", action = "Search" } // Parameter defaults
            );

            routes.MapRoute(
                "transcript_route", // Route name
                "transcript/{account}/{*url}", // URL with parameters
                new { controller = "Home", action = "Transcript" } // Parameter defaults
            );

            routes.MapRoute(
                "Default", // Route name
                "{controller}/{action}/{id}", // URL with parameters
                new { controller = "Home", action = "Index", id = UrlParameter.Optional } // Parameter defaults
            );

        }

        protected void Application_Start()
        {
            LogManager.GetCurrentClassLogger().Info("Blaze is starting up");
            AreaRegistration.RegisterAllAreas();

            RegisterGlobalFilters(GlobalFilters.Filters);
            RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);
        }

        protected void Application_BeginRequest()
        {
            var context = HttpContext.Current;
            var bundle = context.Request["bundle"];
            if( bundle != null)
            {
                BundleTable.EnableOptimizations = bundle != "0" && bundle != "false";
            }
        }

        protected void Application_EndRequest()
        {
            if (Context.Response.StatusCode == 302 && Context.Request.Headers["X-Requested-With"] == "XMLHttpRequest")
            {
                Context.Response.Clear();
                Context.Response.StatusCode = 401;
            }
        }

    }
}