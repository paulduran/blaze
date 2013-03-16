﻿using JabbR.ContentProviders.Core;
using Newtonsoft.Json;
using System;
using System.IO;
using System.Net;

namespace JabbR.ContentProviders
{
    public class UserVoiceContentProvider : CollapsibleContentProvider
    {
        private static readonly string _uservoiceAPIURL = "http://{0}/api/v1/oembed.json?url={1}";

        protected override ContentProviderResultModel GetCollapsibleContent(Uri uri)
        {
            var article = FetchArticle(uri);
            return new ContentProviderResultModel()
                       {
                           Title = article.title,
                           Content = article.html
                       };
        }

        private static dynamic FetchArticle(Uri url)
        {
            var webRequest = (HttpWebRequest) WebRequest.Create(String.Format(_uservoiceAPIURL, url.Host, url.AbsoluteUri));
            webRequest.Accept = "application/json";
            using (var webResponse = webRequest.GetResponse())
            {
                using (var sr = new StreamReader(webResponse.GetResponseStream()))
                {
                    return JsonConvert.DeserializeObject(sr.ReadToEnd());
                }
            }
        }

        protected override bool IsValidContent(Uri uri)
        {
            return uri.Host.IndexOf("uservoice.com", StringComparison.OrdinalIgnoreCase) >= 0;
        }
    }
}