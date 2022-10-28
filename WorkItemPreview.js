//#########################################################//
/* ------------------------------------------------------- */
/* ------------ Custom WorkItem Preview  ----------------- */
/* ------------------------------------------------------- */
// Tested with portal v7.2.2016.1, v7.4.2016.11, v8.0.2016.6, 11.6.0.2016
// Tested with IE11, Chrome 55, Firefox 45 & Edge
// Author: Martin Blomgren
// Contributors: Adam Dzyacky, Leigh Kilday, Jeff Lang
// Description: Display a modal preview window when hovering over workitem title for atleast 1s,
//              replaces service account name if there is a match.
// v0.4 added variables to allow for setting which column to work from, and also to set if it works off the text or an "eye" icon.
// v0.3 Should Work on all(?) grid views, fixed RA with no reviewer based on Leigh Kilday's contribution.
//      Added colors based on workitem type from Adam Dzyacky's contribution.
// v0.2 Calculate window position based on where on screen grid title is and the actual height of modal window
// v0.1 Initial release
(function() {
	//##################### CHANGE THESE VARIABLES TO MATCH YOUR SETTINGS #########################################//
	var serviceAccountName = "domain\workflowaccount"; // Needed for both name change and ability to hide those entries
	var hideServiceAccountEntries = false;          // Hide all entries made from above service account, true/false
	var newServiceAccountName = "workflow displayname";  // Name to display instead of service account
	
	var customServiceRequestArea = false;       // Use custom extended area for service requests
	var ServiceRequestArea = "MyCustomArea";    // Custom extended area name
	
	var ColumnNameToUse = 'Title'				// column name to use for mouse hover to display preview
	var usePreviewicon = true				// set to true to use an "eye" icon, set to false to use the text in the column
	//################# DO NOT EDIT BELOW IF YOU DONT KNOW WHAT YOU ARE DOING! ####################################//
	
		$(document).ready(function () {
			if (session.user.Analyst === 0) {
				return;
			}
	
			var url = window.location.href;
			if(url.indexOf("/View/") === -1){ // Loosely verify we are on a page with a gridview. Not really reliable, but it helps...
				return;
			}
			
			//The navigation node doesn't load immediately. Get the main div that definitely exists.
			var mainPageNode = document.getElementById('main_wrapper');
			
			// create an observer instance
			var observer = new MutationObserver(function(mutations) {
				//The page changed. See if our title exists. If it does, then our gridview should also exist.
				var titleElement = $(".page_title"); //The title always exists. If this page has a gridview, then it also exists as soon as the title does.
				
				if (titleElement.length > 0) { //An element with class of page_title exists.
					var gridElement = $('[data-role=grid]') // Get the grid object
					if (gridElement.length > 0) {
						AddEventHandlersOnGridDataSourceChange(gridElement);
	
						//We are done observing.
						observer.disconnect();
					}
				}
				
			});
			
			// configure the observer and start the instance.
			var observerConfig = { attributes: true, childList: true, subtree: true, characterData: true };
			observer.observe(mainPageNode, observerConfig);
			
		});
	
		function AddEventHandlersOnGridDataSourceChange(gridElement) {
			//Add style to DOM
			ApplyStyleSheetWIPreview();
	
			var kendoGridElement = gridElement.data('kendoGrid'); //...as a kendo widget
			
			//Whenever the data changes, update the totals if applicable.
			//kendoGridElement.bind("dataBound", AddEventHandlers);
			//kendoGridElement.bind("gridBound", AddEventHandlers); 
			app.events.subscribe('gridBound', function(){
				AddEventHandlers();
			});
			//Note to self. the dataBound fires after the rows are returned, and dataBinding fires before. 
		}
	
		function AddEventHandlers() {
			var timer;
			var indexUse = $('thead > tr th[data-field=' + ColumnNameToUse + ']').last().index();
	
			$('tbody > tr').each(function(index, item) {
				//set default to hover over 'td'
				elementToLookUp = 'td:eq(' + indexUse + ')';
				//if use icon set to true then add icon to right side of the selected column, and set hover item as the icon
				if (usePreviewicon == true) {
					var assignedElem = $(this).children('td').eq(indexUse);
					var newElem = $('<i id="previewPopup-Row' + index + '" class="fa fa-eye pull-right" style="font-size: 1.0rem; margin-right: -11px;"></i>');
					assignedElem.append(newElem);
					elementToLookUp = '.fa.fa-eye';
				}
				// on mouseover
				$(elementToLookUp, item).on({
					mousemove: function(e) {
						$('.workitem-preview').css({
							left: e.pageX + 30
						});
					},
					mouseenter: function(e) {
						var that = this;
						timer = setTimeout(function() {
							var indexId = $('thead > tr th[data-title=ID]').last().index();
							var idElem = $('td', item).eq(indexId);
	
							var workItemId = idElem.text();

							var projectionTypeId;
							if (workItemId.indexOf("IR") >= 0) {
								projectionTypeId = "2d460edd-d5db-bc8c-5be7-45b050cba652";
							} else if (workItemId.indexOf("SR") >= 0) {
								projectionTypeId = "7ffc8bb7-2c2c-0bd9-bd37-2b463a0f1af7";
							} else if (workItemId.indexOf("CR") >= 0) {
								projectionTypeId = "4C8F4F06-4C8F-A1B6-C104-89CFB7B593FA";
							} else if (workItemId.indexOf("PR") >= 0) {
								projectionTypeId = "AA6D17AC-0ED8-5D86-D862-CFF4CD8792FA";
							} else if (workItemId.indexOf("RR") >= 0) {
						    	projectionTypeId= "556e527e-893c-61fa-5663-49d9944fccbd";
						    } else if (workItemId.indexOf("RA") >= 0) {
								projectionTypeId = "3043253C-959E-25BD-32B4-C5EB1A7E71DC";
							} else if (workItemId.indexOf("MA") >= 0) {
								projectionTypeId = "953BEAEE-ACF8-A195-363D-4782B2F919AC"
							}
							// Get item via API
							$.getJSON('/api/V3/Projection/GetProjection', 
							{ 
							"id": workItemId,
							"typeProjectionId": projectionTypeId
							}, 
							function (data) {
								var preview = createWorkItemPreviewHtml(data);
								
								$('body').append(preview);
	
								$('.workitem-preview').css({
									top: e.pageY - 300,
									left: e.pageX + 30
								});
	
								var el = document.getElementsByClassName('workitem-preview')[0];
								var rect = el.getBoundingClientRect();
	
								var topPos = (rect.bottom > window.innerHeight) ? e.pageY - 300 - (rect.bottom - window.innerHeight) - 10 : e.pageY - 300;
								topPos = (topPos < 0) ? -20 : topPos;
	
								$('.workitem-preview').css({
									top: topPos,
									left: e.pageX + 30
								});
							});
	
						}, 1000);            
					},
					mouseleave: function() {
						clearTimeout(timer);
						$('.workitem-preview').remove();
					}
				});
			});
		}
	
		var GetEntryHtml = function(entries) {
			var html = "";
			if (entries) {
				//sort comments
				entries.sort(function(a,b) {return (b.EnteredDate > a.EnteredDate) ? 1 : ((a.EnteredDate > b.EnteredDate) ? -1 : 0);} );
				//create messages
				html = '<ul class="chat">';
				for (i = 0; i < entries.length; i++) {
					// don't show service account entries if configured
					if (entries[i].EnteredBy.split('\\').join('').toLowerCase() == serviceAccountName.toLowerCase() && hideServiceAccountEntries) {
						continue;
					}                
					// check which properties to use
					var private = entries[i].IsPrivate ? "private" : "";
					var enteredBy = (entries[i].EnteredBy.split('\\').join('').toLowerCase() == serviceAccountName.toLowerCase()) ? newServiceAccountName : entries[i].EnteredBy;
					var description = entries[i].Comment ? entries[i].Comment : entries[i].Description;
					var type = (function() {
						if (entries[i].ClassName == "System.WorkItem.TroubleTicket.UserCommentLog") {
							return localization.EndUserComment;
						} else if (entries[i].ClassName == "System.WorkItem.TroubleTicket.AnalystCommentLog") {
							return localization.AnalystComment;
						} else {
							return entries[i].Title;
						}
					})();
					var image = (function() {
						if (private) {
							return app.config.icons.privateComment;
						} else if (entries[i].ClassName == "System.WorkItem.TroubleTicket.UserCommentLog" || entries[i].ClassName == "System.WorkItem.TroubleTicket.AnalystCommentLog") {
							return app.config.icons.comment;
						} else if (entries[i].ActionType) {
							return app.config.icons[entries[i].ActionType.Id];
						} else if (entries[i].Title) {
							return app.config.icons[entries[i].Title];
						}
					})();
					html += 
						'<li class="left clearfix ' + private + ' ' + type.toLowerCase() + '">'+
							'<span class="chat-img pull-left">'+
								'<img src="' + app.config.iconPath + image + '" alt="" class="" />' +
							'</span>'+
							'<div class="chat-body clearfix">'+
								'<div class="">'+
									'' + enteredBy +' (' + type + ') <span class="pull-right text-muted"><span class="pull-left">'+
										'<i class="fa fa-clock-o"></i> ' + app.lib.getFormattedLocalDateTime(entries[i].EnteredDate + " UTC") + '</span></span>'+
								'</div>'+
								'<p>' + app.lib.escapeHTML(description) + '</p>'+
							'</div>'+
						'</li>';
				}
				html += '</ul>';
			}
	
			return html;
		}
	
		var createWorkItemPreviewHtml = function(wi) {
			// get info for preview window
			var supportGroup = "-"
			var messages = "";
			var status = "-";
			var category = "-";
			var source = "-";
			var affectedUser = wi.RequestedWorkItem ? wi.RequestedWorkItem.DisplayName : "-";
			var assignedUser = wi.AssignedWorkItem ? wi.AssignedWorkItem.DisplayName : "-";
	
			// Check workitem class so we can build a html form with correct content
			// INCIDENT
			if(wi.ClassName == "System.WorkItem.Incident") {
				supportGroup = wi.TierQueue.Name;           
				// get comments
				messages = GetEntryHtml(wi.AppliesToTroubleTicket);
				category = wi.Classification.Name;
				source = wi.Source.Name;
				workItemColor = "modalIncident-header";
	
			// SERVICE REQUEST
			} else if (wi.ClassName == "System.WorkItem.ServiceRequest") {
				supportGroup = wi.SupportGroup.Name;
				category = customServiceRequestArea ? wi[ServiceRequestArea].Name : wi.Area.Name;
				source = wi.Source.Name;
				// get comments
				messages = GetEntryHtml(wi.AppliesToWorkItem);
				workItemColor = "modalServiceRequest-header";
	
			// CHANGE REQUEST
			} else if (wi.ClassName == "System.WorkItem.ChangeRequest") {
				category = wi.Area.Name;
				// get comments
				messages = GetEntryHtml(wi.AppliesToWorkItem);
				workItemColor = "modalChangeRequest-header";
	
			// PROBLEM
			} else if (wi.ClassName == "System.WorkItem.Problem") {
				category = wi.Classification.Name;
				source = wi.Source.Name;
				// get comments
				messages = GetEntryHtml(wi.AppliesToTroubleTicket);
				workItemColor = "modalProblem-header";
	
			// RELEASE RECORD
			} else if (wi.ClassName == "System.WorkItem.ReleaseRecord") {
				category = wi.Category.Name;
				// get notes
				if (wi.Notes) {
					messages += '<ul class="chat"><p>' + wi.Notes + '</p></ul>';
				}
				workItemColor = "modalReleaseRecord-header";
	
			// REVIEW ACTIVITY
			} else if (wi.ClassName == "System.WorkItem.Activity.ReviewActivity") {
				if (wi.Reviewer != undefined) {
					for (i = 0; i < wi.Reviewer.length; i++) { 
						if (wi.Reviewer[i].User) {
							assignedUser += wi.Reviewer[i].User.DisplayName;
							assignedUser += '<br>';
						}
					}
				}
				// get notes
				if (wi.Notes) {
					messages += '<ul class="chat"><p>' + wi.Notes + '</p></ul>';
				}
				workItemColor = "modalActivity-header";
	
			// MANUAL ACTIVITY
			}  else if (wi.ClassName == "System.WorkItem.Activity.ManualActivity") {
				// get notes
				if (wi.Notes) {
					messages += '<ul class="chat"><p>' + wi.Notes + '</p></ul>';
				}
				workItemColor = "modalActivity-header";
	
			}
	
			// create html
			var previewHtml = 
			'<div class="modal-dialog modal-lg workitem-preview" role="document">' +
				'<div class="modal-content">' +
					'<div class="modal-header ' + workItemColor + '">' +
						'<h4 class="modal-title pull-left left" id="previewModalLabel">' +
							'<span class="btn btn-info">' + wi.Id + '</span>' + 
							'<span class="title-text">' + wi.Title + '</span>' +
						'</h4>' +
						'<div class="clearfix"></div>' +
					'</div>' +
					'<div class="modal-body">' +
						'<div class="row">' +
							'<div class="col-md-3 col-lg-3 assigned-column" align="left">' +
								'<div class="panel panel-default">' +
									'<div class="panel-body">' +
										'<div class="row assigned-text"><small>' + localization.Source + ':</small><br />' + source + '</div>' +
										'<div class="row assigned-text"><small>' + localization.Affecteduser + ':</small><br />' + affectedUser + '</div>' +
										'<div class="row assigned-text"><small>' + localization.Createddate + ':</small><br />' + app.lib.getFormattedLocalDateTime(wi.CreatedDate + " UTC") + '</div>' +
										'<div class="row assigned-text"><small>' + localization.Lastmodified + ':</small><br />' + app.lib.getFormattedLocalDateTime(wi.LastModified + " UTC") + '</div>' +
										'<div class="row assigned-text"><small>' + localization.Category + ':</small><br />' + category + '</div>' +
										'<div class="row assigned-text"><small>' + localization.Status + ':</small><br />' + wi.Status.Name + '</div>' +
										'<br />' +
										'<!--<div class="row assigned-text"><small>Affected Item:</small><br /></div>-->' +
										'<br />' +
										'<div class="row assigned-text"><small>' + localization.Supportgroup + ':</small><br />' + supportGroup + '</div>' +
										'<br />' +
										'<div class="row assigned-text"><small>' + localization.AssignedUser + ':</small><br />' + assignedUser + '</div>' +
									'</div>' +
								'</div>' +
							'</div>' +
							'<div class="col-md-9 col-lg-9 actionlog-column" style="padding-left: 10px;padding-right: 0;">' +
								'<div class="panel panel-default">' +
									'<table class="table table-user-information">' +
										'<tbody>' +
											'<tr>' +
												'<td class="title-header"><small>' + localization.Title + ':</small></td>' +
												'<td class="title-text">' + wi.Title + '</td>' +
											'</tr>' +
											'<tr>' +
												'<td class="description-text" colspan="2"><small>' + localization.Description + ':</small><br><pre>' + wi.Description + '</pre></td>' +
											'</tr>' +
											'<tr>' +
												'<td class="actionlog-content" colspan="2"><small>' + localization.ActionLog + ':</small><br>' + messages + '</td>' +
											'</tr>' +
										'</tbody>' +
									'</table>' +
								'</div>' +
							'</div><!-- /.col-md9 .col-lg-9 -->' +
						'</div>' +
					'</div><!-- /.panel-body -->' +
				'</div>' +
			'</div>'
			;
	
			return previewHtml;
		}
	
		var ApplyStyleSheetWIPreview = function() {
			var addRule = (function(style){
				var sheet = document.head.appendChild(style).sheet;
				return function(selector, css){
					var propText = Object.keys(css).map(function(p){
						return p+":"+css[p]
					}).join(";");
					sheet.insertRule(selector + "{" + propText + "}", sheet.cssRules.length);
				}
			})(document.createElement("style"));
	
			addRule(".workitem-preview", {
				"position": "fixed !important",
				"z-index": "5000"
			});
	
			addRule(".workitem-preview .modal-header", {
				"padding": "10px 15px !important"
			});
	
			//addRule(".workitem-preview .modal-header .btn", {
			//    "background-color": "#47a447 !important",
			//    "border-color": "#398439 !important"
			//});
	
			addRule(".workitem-preview .modalIncident-header .btn", {
				"background-color": "#ff8b02 !important",
				"border-color": "#ff8b02 !important"
			});
			
			addRule(".workitem-preview .modalServiceRequest-header .btn", {
				"background-color": "#47a447 !important",
				"border-color": "#398439 !important"
			});
			
			addRule(".workitem-preview .modalChangeRequest-header .btn", {
				"background-color": "#00a8ff !important",
				"border-color": "#00a8ff !important"
			});
			
			addRule(".workitem-preview .modalProblem-header .btn", {
				"background-color": "#ff0000 !important",
				"border-color": "#ff0000 !important"
			});
			
			addRule(".workitem-preview .modalReleaseRecord-header .btn", {
				"background-color": "#a831e0 !important",
				"border-color": "#a831e0 !important"
			});
			
			addRule(".workitem-preview .modalActivity-header .btn", {
				"background-color": "#623f1c !important",
				"border-color": "#623f1c !important"
			});
	
			addRule(".workitem-preview .modal-header .title-text", {
				"margin-left": "20px"
			});
	
			addRule(".workitem-preview .modal-body", {
				"padding": "10px"
			});
	
			addRule(".workitem-preview .assigned-column", {
				"padding-right": "0",
				"max-width": "200px"
			});
	
			addRule(".workitem-preview .assigned-column .panel", {
				"padding": "10px",
				"border": "1px solid #ddd",
				"border-radius": "0"
			});
	
			addRule(".workitem-preview .assigned-column .panel-body", {
				"padding": "0px 10px 10px 30px"
			});
	
			addRule(".workitem-preview .assigned-column .assigned-text", {
				"padding-bottom": "5px",
				"font-size": "13px"
			});
	
			addRule(".workitem-preview .assigned-column .assigned-text small", {
				"font-size": "11px"
			});
	
			addRule(".workitem-preview .actionlog-column", {
				"padding-left": "10px",
				"padding-right": "0"
			});
	
			addRule(".workitem-preview .actionlog-column .panel", {
				"padding": "5px 5px 5px 10px",
				"border": "1px solid #ddd",
				"border-radius": "0"
			});
	
			addRule(".workitem-preview .actionlog-column .title-header", {
				"width": "45px",
				"font-size": "11px"
			});
	
			addRule(".workitem-preview .actionlog-column .title-text", {
				"font-size": "13px",
				"margin": "0"
			});
	
			addRule(".workitem-preview .actionlog-column .description-text small", {
				"font-size": "11px"
			});
	
			addRule(".workitem-preview .actionlog-column .description-text pre", {
				"border-radius": "0",
				"margin-bottom": "0",
				"padding": "5px",
				"width": "100%",
				"overflow": "auto",
				"white-space": "pre-line"
			});
	
			addRule(".workitem-preview .actionlog-column .actionlog-content > small", {
				"font-size": "11px"
			});
	
			addRule(".chat", {
				"list-style": "none",
				"margin": "0",
				"padding": "0",
				"font-size": "11px"
			});
	
			addRule(".chat li", {
				"margin": "0px",
				"margin-bottom": "1px",           
				"padding": "5px",
				"border-bottom": "1px dotted #B3A9A9",
				"color": "#777777"
			});
	
			addRule(".chat li .text-muted", {
				"margin": "0",
				"color": "#777777",
				"font-size": "12px",
				"width": "140px"
				
			});
	
			addRule(".chat li.comment", {
				"background-color": "#fafafa",
				"border": "1px solid #ddd",
				"border-bottom": "1px dotted #B3A9A9",
				"color": "#505050",
				"font-size": "13px"
				
			});
	
			addRule(".chat li.comment .text-muted", {
				"margin": "0",
				"color": "#505050"
			});
	
			addRule(".chat li.comment .chat-body p", {
				"margin": "0",
				"color": "#505050",
				"white-space": "pre-wrap"
			});
	
			addRule(".chat li.private", {
				"background-color": "#fcf8e3",
				"border": "1px solid #faebcc",
				"border-bottom": "1px dotted #B3A9A9",
				"color": "#cc1a59"
			});
	
			addRule(".chat li.private .text-muted", {
				"margin": "0",
				"color": "#cc1a59"
			});
	
			addRule(".chat li.private .chat-body p", {
				"margin": "0",
				"color": "#cc1a59",
				"white-space": "pre-wrap"
			});
	
			addRule(".chat li.private small", {
				"margin": "0",
				"color": "#cc1a59"
			});
	
			addRule(".chat chat-img", {
				"padding-top": "5px"
			});
	
			// Added Overflow Hidden to Parent left
			addRule(".chat li.left", {
				"height": "100%",
				"max-height": "100%",
				"overflow-y": "hidden"
			});
			
			// Added Overflow Scroll to Chat-body li
			addRule(".chat li.left .chat-body", {
				"margin-left": "30px",
				"height": "auto",
				"max-height": "300px",
				"overflow-y": "auto",
				"overflow-x": "hidden" 
			});
	
			addRule(".chat li.left .chat-body", {
				"margin-left": "30px"
			});
	
			addRule(".chat li .chat-body p", {
				"margin": "0",
				"color": "#777777",
				"white-space": "pre-wrap"
			});
	
			addRule(".chat li .chat-body .fa", {
				"font-size": "12px"
			});
		}
	})();
	/* ------------------------------------------------------- */
	/* -----------End Custom WorkItem Preview  --------------- */
	/* ------------------------------------------------------- */
	