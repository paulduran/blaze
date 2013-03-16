using System;
using System.ComponentModel.Composition;

namespace JabbR.ContentProviders.Core
{
    [InheritedExport]
    public interface IContentProvider
    {
        ContentProviderResultModel GetContent(Uri uri);
    }
}
