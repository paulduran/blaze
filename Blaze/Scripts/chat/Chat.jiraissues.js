(function ($, window, ui) {
    'use strict';

    function transformOldIssue(issue) {
        return {
            key: issue.key,
            fields: {
                reporter: {
                    name: issue.fields.reporter.value == null ? null : issue.fields.reporter.value.displayName,
                    avatarUrls: { '48x48': null }
                },
                created: issue.fields.created.value,
                summary: issue.fields.summary.value,
                description: issue.fields.description.value,
                html_url: issue.self.replace('/rest/api/latest/issue/', '/browse/'),
                issuetype: {
                    name: issue.fields.issuetype.value.name
                },
                status: {
                    name: issue.fields.status.value.name
                },
                assignee: issue.fields.assignee.value == null ? null : {
                    login: issue.fields.assignee.value.name,
                    name: issue.fields.assignee.value.displayName,
                    avatarUrls: { '16x16': null }
                }
            }
        };
    }

    window.addJiraIssue = function (issue) {
        
        if (issue.fields.description && issue.fields.description.value) {
            // its in the old format - extract the stuff we need            
            issue = transformOldIssue(issue);            
        }

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