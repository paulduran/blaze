using NLog;
using System;
using System.Web.Mvc;

namespace Blaze.Controllers
{
    public class AuthActionFilter : ActionFilterAttribute
    {
        private readonly OAuthService oAuthService;
        private readonly Logger log = LogManager.GetCurrentClassLogger();

        public AuthActionFilter()
        {
            oAuthService = new OAuthService();
            Required = true;
        }

        public bool Required { get; set; }

        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            var req = filterContext.RequestContext.HttpContext.Request;
            var accessTokenCookie = req.Cookies["BlazeAT"];
            string accessToken = null;
            if( accessTokenCookie == null )
            {
                var refreshTokenCookie = req.Cookies["BlazeRT"];
                if(refreshTokenCookie != null && !string.IsNullOrEmpty(refreshTokenCookie.Value))
                {                    
                    log.Info("Attempting to refresh oauth token");
                    try
                    {
                        var tokens = oAuthService.RefreshTokens(refreshTokenCookie.Value);
                        tokens.RefreshToken = refreshTokenCookie.Value;
                        oAuthService.AssignCookies(tokens, filterContext.RequestContext.HttpContext.Response);
                        accessToken = tokens.AccessToken;
                    } catch (Exception ex)
                    {
                        log.ErrorException("Error refreshing oauth token using value: " + refreshTokenCookie.Value, ex);
                        filterContext.Result = new RedirectResult(oAuthService.GetLoginUrl());
                    }
                }
                else
                {
                    if( Required )
                        filterContext.Result = new RedirectResult(oAuthService.GetLoginUrl());
                }
            }
            else
                accessToken = accessTokenCookie.Value;

            if(filterContext.ActionParameters.ContainsKey("auth"))
                filterContext.ActionParameters["auth"] = accessToken;
        }
    }
}