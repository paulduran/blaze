using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using JabbR.ContentProviders.Core;

namespace Blaze.Controllers
{
    public class MessageProcessor
    {
        private readonly ResourceProcessor _resourceProcessor;

        public MessageProcessor()
        {
            _resourceProcessor = new ResourceProcessor();
        }

        public string ProcessMessage(string message)
        {
            HashSet<string> links;
            var result = ParseChatMessageText(message, out links);
            if(links.Any())
                return ProcessUrls(links, result);
            return result;
        }

        private string ParseChatMessageText(string content, out HashSet<string> links)
        {
            string message = Parse(content);
            return TransformAndExtractUrls(message, out links);
        }

        public string Parse(string message)
        {
            return ConvertTextWithNewLines(message);
        }

        private string ConvertTextWithNewLines(string message)
        {
            // If the message contains new lines wrap all of it in a pre tag
            if (message.Contains('\n'))
            {
                return String.Format(@"
<div class=""collapsible_content"">
    <h3 class=""collapsible_title"">Paste (click to show/hide)</h3>
    <div class=""collapsible_box"">
        <pre class=""multiline"">{0}</pre>
    </div>
</div>
", HttpUtility.HtmlDecode(message));
            }

            return message;
        }

        public static string TransformAndExtractUrls(string message, out HashSet<string> extractedUrls)
        {
            const string urlPattern = @"((https?|ftp)://|www\.)[\w]+(.[\w]+)([\w\-\.\[\],@?^=%&amp;:/~\+#!]*[\w\-\@?^=%&amp;/~\+#\[\]])";

            var urls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            message = Regex.Replace(message, urlPattern, m =>
                                                             {
                                                                 string httpPortion = String.Empty;
                                                                 if (!m.Value.Contains("://"))
                                                                 {
                                                                     httpPortion = "http://";
                                                                 }

                                                                 string url = httpPortion + m.Value;

                                                                 urls.Add(HttpUtility.HtmlDecode(url));

                                                                 return String.Format(CultureInfo.InvariantCulture,
                                                                                      "<a rel=\"nofollow external\" target=\"_blank\" href=\"{0}\" title=\"{1}\">{1}</a>",
                                                                                      url, m.Value);
                                                             });

            extractedUrls = urls;
            return message;
        }

        private string ProcessUrls(IEnumerable<string> links, string content)
        {
            string result = content;
            // REVIEW: is this safe to do? We're holding on to this instance 
            // when this should really be a fire and forget.
            var contentTasks = links.Select(_resourceProcessor.ExtractResource).ToArray();
            var end = Task.Factory.ContinueWhenAll(contentTasks, tasks =>
            {
                foreach (var task in tasks)
                {
                    if (task.IsFaulted)
                    {
                        Trace.TraceError(task.Exception.GetBaseException().Message);
                        continue;
                    }

                    if (task.Result == null || String.IsNullOrEmpty(task.Result.Content))
                    {
                        continue;
                    }

                    // Try to get content from each url we're resolved in the query
                    string extractedContent = "<p>" + task.Result.Content + "</p>";

                    // If we did get something, update the message and notify all clients
                    result += extractedContent;
                }
            });
            end.Wait();
            return result;
        }
    }
}