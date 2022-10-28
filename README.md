# Cireson WorkItem Preview on Hover

THis solution adds the ability the get a quick glance of a workitem to see for example whether it's something I could act on or if the latest response from the end user is of any value without opening the workitem is something I think makes work easier and faster for the analyst.

Tested with portal v7.2.2016.1, v7.4.2016.11, v8.0.2016.6, 11.6.0.2016
Tested with IE11, Chrome 55, Firefox 45 & Edge
Author: Martin Blomgren
Contributors: Adam Dzyacky, Leigh Kilday, Jeff Lang, Brett Moffett

Description: Display a modal preview window when hovering over workitem title for atleast 1 second, replaces service account name if there is a match.

v0.4  Added variables to allow for setting which column to work from, and also to set if it works off the text or an "eye" icon.
v0.3  Should Work on all(?) grid views, fixed RA with no reviewer based on Leigh Kilday's contribution.
      Added colors based on workitem type from Adam Dzyacky's contribution.
v0.2  Calculate window position based on where on screen grid title is and the actual height of modal window
v0.1  Initial release
