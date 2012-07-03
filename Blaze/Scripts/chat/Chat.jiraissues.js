(function ($, window, ui) {
    'use strict';

    window.addJiraIssue = function (issue) {
        // Keep track of whether we're need the end, so we can auto-scroll once the tweet is added.
        var nearEnd = ui.isNearTheEnd(),
            elements = null;

        elements = $('div.jira-issue-' + issue.key)
            .removeClass('jira-issue-' + issue.key);


        issue.fields.description = chat.utility.markdownToHtml(issue.fields.description);

        // Process the template, and add it in to the div.
        $('#jira-issues-template').tmpl(issue.fields).appendTo(elements);

        // After the string has been added to the template etc, remove any existing targets and re-add with _blank
        $('a', elements).removeAttr('target').attr('target', '_blank');

        $('.js-relative-date').timeago();
        // If near the end, scroll.
        if (nearEnd) {
            ui.scrollToBottom();
        }        
    };

})(jQuery, window, chat.ui);