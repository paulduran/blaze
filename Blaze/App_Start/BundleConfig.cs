using System;
using System.Web.Optimization;

namespace Blaze.App_Start
{
    public class BundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.IgnoreList.Clear();            
            AddDefaultIgnorePatterns(bundles.IgnoreList);
            bundles.Add(new StyleBundle("~/Content/chat/css").Include("~/Content/chat/*.css"));
            bundles.Add(new StyleBundle("~/Content/css").Include("~/Content/*.css"));
            bundles.Add(new StyleBundle("~/Content/public/css").Include("~/Content/public/*.css"));

            bundles.Add(new ScriptBundle("~/Scripts/js")
                            .Include(
                                     "~/Scripts/jquery-1.8.0.js",
                                     "~/Scripts/jQuery.tmpl.min.js",
                                     "~/Scripts/jquery.autogrow.js",
                                     "~/Scripts/jquery.autotabcomplete.js",
                                     "~/Scripts/jquery.captureDocumentWrite.js",
                                     "~/Scripts/jquery.cookie.js",
                                     "~/Scripts/jquery.fileupload.js",
                                     "~/Scripts/vendor/jquery.ui.widget.js",
                                     "~/Scripts/jquery.insertAtCaret.js",
                                     "~/Scripts/jquery.linkify.1.0-min.js",
                                     "~/Scripts/jquery.placeholder.js",
                                     "~/Scripts/jquery.scrollto.js",
                                     "~/Scripts/jquery.timeago.0.10.js",
                                     "~/Scripts/jstorage.js",
                                     "~/Scripts/knockout-2.1.0.js",
                                     "~/Scripts/Markdown.Converter.js",
                                     "~/Scripts/md5.js"));
            bundles.Add(new ScriptBundle("~/Scripts/chat/js")
                            .Include("~/Scripts/chat/*.js"));
            bundles.Add(new ScriptBundle("~/Scripts/blaze/js")
                            .Include("~/Scripts/blaze/*.js"));
        }

        public static void AddDefaultIgnorePatterns(IgnoreList ignoreList)
        {
            if (ignoreList == null)
                throw new ArgumentNullException("ignoreList");
            ignoreList.Ignore("*.intellisense.js");
            ignoreList.Ignore("*-vsdoc.js");
        }
    }
}