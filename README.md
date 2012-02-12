Blaze - Campfire web client
===========================
Links
------
* Live Site : https://blaze.apphb.com
* Trello board: https://trello.com/board/blaze/4f344de5199056394208474f

Info
----
Blaze is an alternative to the standard campfire web client.

I decided to build it because the existing campfire web client was rather clunky and outdated. It does full-page refreshes when changing tabs, logs you out if you sit in the lobby tab for too long and doesnt support desktop notifications.

Please report any bugs or feature requests via the github issues board.

Paul Duran   
Twitter: @fatal_2


Implemented Features
--------------------
* ajax tabbed interface
* window title includes unread message count
* inactive tab highlighted if there are new messages
* multiple notifications collapsed to save space 
* uses JabbR content providers. Inline content included for urls from:
 - Twitter
 - Youtube
 - Vimeo
 - BBC news
 - Gist
 - Github issues
 - and many more

Planned Features:
-----------------
* configurable desktop notifications for active/inactive tabs
* drag/drop file upload 
* responsive interface - UI should adapt to size of the window. less important features (recent files etc) dropped if space is minimal
* see the Trello board for more 
