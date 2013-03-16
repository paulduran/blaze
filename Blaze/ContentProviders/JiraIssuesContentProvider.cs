using JabbR.ContentProviders.Core;
using System;
using System.Text.RegularExpressions;

namespace JabbR.ContentProviders
{
    public class JiraIssuesContentProvider : CollapsibleContentProvider
    {
        private static readonly Regex JiraIssuesRegex = new Regex(@"(https?://.*?)/browse/([A-Z]+-\d+)");
        private const string JiraIssuesApiFormat = "{0}/rest/api/latest/issue/{1}?jsonp-callback=addJiraIssue";
        private const string JiraIssuesContentFormat = "<div class='jira-issue jira-issue-{0}'></div><script src='{1}'></script>";

        protected override ContentProviderResultModel GetCollapsibleContent(Uri uri)
        {
            var parameters = ExtractParameters(uri);

            return new ContentProviderResultModel
                {
                Content = String.Format(JiraIssuesContentFormat,
                        parameters[1],
                    String.Format(JiraIssuesApiFormat, parameters[0], parameters[1])
                ),
                Title = uri.AbsoluteUri
            };
        }

        protected override Regex ParameterExtractionRegex
        {
            get
            {
                return JiraIssuesRegex;
            }
        }

        protected override bool IsValidContent(Uri uri)
        {
            return ExtractParameters(uri).Count == 2;
        }
    }
}