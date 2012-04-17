using System.Web.Mvc;

namespace Blaze.Controllers
{
    public class AuthActionFilter : ActionFilterAttribute
    {
        private readonly OAuthService oAuthService;

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
                if(refreshTokenCookie != null )
                {                    
                    var tokens = oAuthService.RefreshTokens(refreshTokenCookie.Value);
                    oAuthService.AssignCookies(tokens, filterContext.RequestContext.HttpContext.Response);
                    accessToken = tokens.AccessToken;
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