using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Blaze.Models
{
    public class HomeModel
    {
        public IEnumerable<Emoji> Emojis { get; set; }
    }

    public class Emoji
    {
        public string Name { get; set; }
        public string ImageUrl { get; set; }
    }
}