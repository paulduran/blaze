using System.Net;
using RestSharp;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Web;

namespace Blaze.Controllers
{
    public class OAuthService
    {
        private const string LaunchpadBaseUrl = "https://launchpad.37signals.com";

        private readonly string clientId;
        private readonly string clientSecret;
        public OAuthService()
        {
            clientId = ConfigurationManager.AppSettings["ClientID"];
            clientSecret = ConfigurationManager.AppSettings["ClientSecret"];
        }

        public LaunchpadTokens GetTokens(string code)
        {
            var request = new RestRequest("/authorization/token", Method.POST);
            request.AddParameter("client_id", clientId);
            request.AddParameter("type", "web_server");
            request.AddParameter("client_secret", clientSecret);
            request.AddParameter("redirect_uri", GetRedirectUri());
            request.AddParameter("code", code);
            var client = new RestClient(LaunchpadBaseUrl);
            IRestResponse<LaunchpadTokens> reply = client.Execute<LaunchpadTokens>(request);
            if (reply.StatusCode == HttpStatusCode.OK)
            {
                return reply.Data;
            }
            throw new Exception(string.Format("Error retrieving Launchpad tokens. Status: {0} ({1}) Content: {2}. Error Message: {3}. Error Exception: {4}", reply.StatusCode, reply.StatusDescription, reply.Content, reply.ErrorMessage, reply.ErrorException));
        }

        public LaunchpadTokens RefreshTokens(string refreshToken)
        {
            var request = new RestRequest("/authorization/token", Method.POST);
            request.AddParameter("client_id", clientId);
            request.AddParameter("type", "refresh");
            request.AddParameter("client_secret", clientSecret);
            request.AddParameter("redirect_uri", GetRedirectUri());
            request.AddParameter("refresh_token", refreshToken);
            var client = new RestClient(LaunchpadBaseUrl);
            var reply = client.Execute<LaunchpadTokens>(request);
            return reply.Data;
        }

        public AuthorizationReply GetInfo(string accessToken)
        {
            var request = new RestRequest("/authorization.json");
            request.AddHeader("Authorization", "Bearer " + accessToken);
            var client = new RestClient(LaunchpadBaseUrl);
            var reply = client.Execute<AuthorizationReply>(request);
            return reply.Data;
        }

        public string GetLoginUrl()
        {
            return string.Format(
                "{0}/authorization/new?type=web_server&client_id={1}&redirect_uri={2}", LaunchpadBaseUrl,
                clientId, HttpUtility.UrlEncode(GetRedirectUri()));
        }

        private string BaseUrl
        {
            get
            {
                var request = HttpContext.Current.Request;
                var uri = new UriBuilder
                              {
                                  Host = request.Url.Host,
                                  Port = 80,
                                  Scheme = "http"
                              };
                if (request.IsLocal)
                    uri.Port = request.Url.Port;

                return uri.Uri.ToString();
            }
        }


        private string GetRedirectUri()
        {
            return BaseUrl + "Home/LaunchpadCallback";
        }

        public void AssignCookies(LaunchpadTokens tokens, HttpResponseBase response)
        {
            var accessTokenCookie = new System.Web.HttpCookie("BlazeAT", tokens.AccessToken);
            accessTokenCookie.Expires = DateTime.Now.AddSeconds(tokens.ExpiresIn > 3600 ? (tokens.ExpiresIn - 360) : tokens.ExpiresIn);
            var refreshTokenCookie = new System.Web.HttpCookie("BlazeRT", tokens.RefreshToken);
            refreshTokenCookie.Expires = DateTime.Now.AddMonths(3);

            response.Cookies.Add(accessTokenCookie);
            response.Cookies.Add(refreshTokenCookie);
        }
    }

    public class Account
    {
        public string Name { get; set; }
        public string Href { get; set; }
        public int Id { get; set; }
        public string Product { get; set; }
    }

    public class Identity
    {
        public int Id { get; set; }
        public string LastName { get; set; }
        public string EmailAddress { get; set; }
        public string FirstName { get; set; }
    }

    public class AuthorizationReply
    {
        public List<Account> Accounts { get; set; }
        public string ExpiresAt { get; set; }
        public Identity Identity { get; set; }
    }
}