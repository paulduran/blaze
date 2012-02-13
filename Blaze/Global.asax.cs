using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

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
            
            routes.MapRoute(
                "get_upload_route", // Route name
                "uploads/{auth}/{account}/{*url}", // URL with parameters
                new { controller = "Home", action = "GetFile" } // Parameter defaults
            );

            routes.MapRoute(
                "proxy_route", // Route name
                "x/{account}/{*url}", // URL with parameters
                new { controller = "Home", action = "Proxy" } // Parameter defaults
            );

            routes.MapRoute(
                "recent_route", // Route name
                "recent/{account}/{*url}", // URL with parameters
                new { controller = "Home", action = "Recent" } // Parameter defaults
            );

            routes.MapRoute(
                "Default", // Route name
                "{controller}/{action}/{id}", // URL with parameters
                new { controller = "Home", action = "Index", id = UrlParameter.Optional } // Parameter defaults
            );

        }

        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();

            RegisterGlobalFilters(GlobalFilters.Filters);
            RegisterRoutes(RouteTable.Routes);
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