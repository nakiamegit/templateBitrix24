(function(){

	if (!!BX.BXSGM24)
	{
		return;
	}

	BX.BXSGM24 = {
		currentUserId: null,
		groupdId: null,
		groupType: null,
		userIsMember: null,
		userIsAutoMember: null,
		userRole: null,
		isProject: null,
		isScrumProject: null,
		favoritesValue: null,
		canInitiate: null,
		canModify: null,
		canProcessRequestsIn: false,
		canPickTheme: false,
		editFeaturesAllowed: true,
		pageId: null,
		urls: {},
	};

	BX.BXSGM24.init = function(params) {

		this.currentUserId = parseInt(params.currentUserId);
		this.groupId = parseInt(params.groupId);
		this.groupType = params.groupType;
		this.projectTypeCode = params.projectTypeCode;
		this.userIsMember = !!params.userIsMember;
		this.userIsAutoMember = !!params.userIsAutoMember;
		this.userRole = params.userRole;
		this.isProject = !!params.isProject;
		this.isScrumProject = !!params.isScrumProject;
		this.isOpened = !!params.isOpened;
		this.favoritesValue = !!params.favoritesValue;
		this.canInitiate = !!params.canInitiate;
		this.canModify = !!params.canModify;
		this.canProcessRequestsIn = !!params.canProcessRequestsIn;
		this.canPickTheme = !!params.canPickTheme;
		this.pageId = params.pageId;
		this.avatarPath = params.avatarPath;
		this.avatarType = params.avatarType;

		this.scrumMeetings = null;
		this.scrumMethodology = null;
		this.projectWidgetInstance = null;

		if (!BX.type.isUndefined(params.urls))
		{
			this.urls = params.urls;
		}

		this.editFeaturesAllowed = (!BX.type.isUndefined(params.editFeaturesAllowed) ? !!params.editFeaturesAllowed : true);
		this.copyFeatureAllowed = (!BX.type.isUndefined(params.copyFeatureAllowed) ? !!params.copyFeatureAllowed : true);

		var f = BX.delegate(function(eventData) {

			if (!BX.type.isNotEmptyString(eventData.code))
			{
				return;
			}

			if (BX.util.in_array(eventData.code, [ 'afterJoinRequestSend', 'afterEdit' ]))
			{
				if (BX('bx-group-menu-join-cont'))
				{
					BX('bx-group-menu-join-cont').style.display = "none";
				}
				BX.SocialnetworkUICommon.reload();
			}
			else if (BX.util.in_array(eventData.code, [ 'afterSetFavorites' ]))
			{
				var sonetGroupMenu = BX.SocialnetworkUICommon.SonetGroupMenu.getInstance();
				var favoritesValue = sonetGroupMenu.favoritesValue;

				sonetGroupMenu.setItemTitle(!favoritesValue);
				sonetGroupMenu.favoritesValue = !favoritesValue;
			}
			else if (
				BX.util.in_array(eventData.code, [ 'afterDelete', 'afterLeave' ])
				&& BX.type.isNotEmptyObject(eventData.data)
				&& !BX.type.isUndefined(eventData.data.groupId)
				&& parseInt(eventData.data.groupId) === parseInt(this.groupId)
			)
			{
				top.location.href = this.urls.GroupsList;
			}

		}, this);

		BX.addCustomEvent('SidePanel.Slider:onMessage', BX.delegate(function(event) {
			if (event.getEventId() == 'sonetGroupEvent')
			{
				var eventData = event.getData();
				f(eventData)
			}
		}, this));
		BX.addCustomEvent('sonetGroupEvent', f);

		if (BX('bx-group-menu-join'))
		{
			BX.bind(BX('bx-group-menu-join'), 'click', BX.delegate(this.sendJoinRequest, this));
		}

		if (BX('bx-group-menu-settings'))
		{
			var sonetGroupMenu = BX.SocialnetworkUICommon.SonetGroupMenu.getInstance();
			sonetGroupMenu.favoritesValue = this.favoritesValue;
			BX.bind(BX('bx-group-menu-settings'), 'click', BX.delegate(this.showMenu, this));
		}

		this.bindEvents();

		var controlButtonContainer = document.getElementById('group-menu-control-button-cont');
		if (controlButtonContainer)
		{
			BX.loadExt('intranet.control-button').then(function() {
				if (BX.Intranet.ControlButton)
				{
					new BX.Intranet.ControlButton({
						container: controlButtonContainer,
						entityType: 'workgroup',
						entityId: this.groupId,
						buttonClassName: 'ui-btn-themes intranet-control-btn-no-hover',
					});
				}
			}.bind(this));
		}

		var scrumMeetingsButton = document.getElementById('tasks-scrum-meetings-button');
		if (scrumMeetingsButton)
		{
			BX.bind(scrumMeetingsButton, 'click', BX.delegate(this.showScrumMeetings, this));
		}

		var scrumMethodologyButton = document.getElementById('tasks-scrum-methodology-button');
		if (scrumMethodologyButton)
		{
			BX.bind(scrumMethodologyButton, 'click', BX.delegate(this.showScrumMethodology, this));
		}

		var projectWidgetButton = document.getElementById('project-widget-button');
		if (projectWidgetButton)
		{
			BX.bind(projectWidgetButton, 'click', BX.delegate(this.showProjectWidget, this));
		}
	};

	BX.BXSGM24.bindEvents = function()
	{
		BX.addCustomEvent('onPullEvent-tasks', function(command, params) {
			if (command === 'user_counter')
			{
				this.onUserCounter(params);
			}
		}.bind(this));

		if (this.pageId !== 'group_tasks')
		{
			return;
		}

		try
		{
			var elements = document.getElementsByClassName("tasks_role_link");
			if (elements.length === 0)
			{
				return;
			}

			for (var key = 0; key < elements.length; key++)
			{
				BX.bind(elements[key], 'click', function(event) {
					event.preventDefault();

					var roleId = (this.dataset.id === 'view_all' ? '' : this.dataset.id);
					var url = this.dataset.url;

					BX.onCustomEvent('Tasks.TopMenu:onItem', [roleId, url]);

					var elements = document.getElementsByClassName('tasks_role_link');
					if (elements.length)
					{
						for (var key = 0; key < elements.length; key++)
						{
							BX.removeClass(elements[key], 'main-buttons-item-active');
						}
					}
					BX.addClass(this, 'main-buttons-item-active');
				});
			}
		}
		catch(e)
		{

		}

		BX.addCustomEvent('BX.Main.Filter:apply', function(filterId, data, ctx) {
			this.onFilterApply(filterId, data, ctx);
		}.bind(this));
	};

	BX.BXSGM24.onUserCounter = function(data)
	{
		if (
			Number(this.currentUserId) !== Number(data.userId)
			|| !Object.prototype.hasOwnProperty.call(data, this.groupId)
		)
		{
			return;
		}

		Object.keys(data[this.groupId]).forEach(function(role) {
			var roleButton = BX('group_panel_menu_' + (this.groupId ? this.groupId + '_' : '') + role);
			if (roleButton)
			{
				roleButton.querySelector('.main-buttons-item-counter').innerText = this.getCounterValue(data[this.groupId][role].total);
			}
		}.bind(this));
	};

	BX.BXSGM24.getCounterValue = function(value)
	{
		if (!value)
		{
			return '';
		}

		var maxValue = 99;

		return (value > maxValue ? maxValue + '+' : value);
	};

	BX.BXSGM24.onFilterApply = function(filterId, data, ctx)
	{
		try
		{
			var roleId = ctx.getFilterFieldsValues().ROLEID;
			var el = document.querySelectorAll('.tasks_role_link');

			for (var i = 0; i < el.length; i++)
			{
				BX.removeClass(el[i], 'main-buttons-item-active');
			}

			if (BX.type.isUndefined(roleId) || !roleId)
			{
				roleId = 'view_all';
			}

			BX.addClass(BX('group_panel_menu_' + this.groupId + '_' + roleId), 'main-buttons-item-active');
		}
		catch (e)
		{

		}
	};

	BX.BXSGM24.sendJoinRequest = function(event)
	{
		var button = event.currentTarget;

		BX.SocialnetworkUICommon.showButtonWait(button);

		BX.ajax.runAction('socialnetwork.api.usertogroup.join', {
			data: {
				params: {
					groupId: this.groupId
				}
			}
		}).then(function(response) {
			BX.SocialnetworkUICommon.hideButtonWait(button);

			if (
				response.data.success
				&& BX.type.isNotEmptyString(this.urls.view)
			)
			{
				BX.onCustomEvent(window.top, 'sonetGroupEvent', [ {
					code: 'afterJoinRequestSend',
					data: {
						groupId: this.groupId
					}
				} ]);

				window.location.href = this.urls.view;
			}
		}.bind(this), function(response) {
			BX.SocialnetworkUICommon.hideButtonWait(button);
		});
	};

	BX.BXSGM24.showMenu = function(event)
	{
		BX.SocialnetworkUICommon.showGroupMenuPopup({
			bindElement: BX.getEventTarget(event),
			groupId: this.groupId,
			groupType: this.groupType,
			userIsMember: this.userIsMember,
			userIsAutoMember: this.userIsAutoMember,
			userRole: this.userRole,
			isProject: this.isProject,
			isScrumProject: this.isScrumProject,
			isOpened: this.groupOpened,
			editFeaturesAllowed: this.editFeaturesAllowed,
			copyFeatureAllowed: this.copyFeatureAllowed,
			canPickTheme: this.canPickTheme,
			perms: {
				canInitiate: this.canInitiate,
				canProcessRequestsIn: this.canProcessRequestsIn,
				canModify: this.canModify
			},
			urls: {
				requestUser: (
					BX.type.isNotEmptyString(this.urls.Invite)
						? this.urls.Invite
						: this.urls.Edit + (this.urls.Edit.indexOf('?') >= 0 ? '&' : '?') + 'tab=invite'
				),
				edit: this.urls.Edit + (this.urls.Edit.indexOf('?') >= 0 ? '&' : '?') + 'tab=edit',
				delete: this.urls.Delete,
				features: this.urls.Features,
				members: this.urls.GroupUsers,
				requests: this.urls.GroupRequests,
				requestsOut: this.urls.GroupRequestsOut,
				userRequestGroup: this.urls.UserRequestGroup,
				userLeaveGroup: this.urls.UserLeaveGroup,
				copy: this.urls.Copy
			}
		});

		event.preventDefault();
	};

	BX.BXSGM24.showScrumMeetings = function(event)
	{
		BX.addClass(event.target, 'ui-btn-wait');

		BX.loadExt('tasks.scrum.meetings').then(function() {
			if (BX.Tasks.Scrum.Meetings)
			{
				if (this.scrumMeetings === null)
				{
					this.scrumMeetings = new BX.Tasks.Scrum.Meetings({
						groupId: this.groupId
					});
				}

				this.scrumMeetings.showMenu(event.target);
			}
			BX.removeClass(event.target, 'ui-btn-wait');
		}.bind(this));

		event.preventDefault();
	};

	BX.BXSGM24.showScrumMethodology = function(event)
	{
		BX.addClass(event.target, 'ui-btn-wait');

		BX.loadExt('tasks.scrum.methodology').then(function() {
			if (BX.Tasks.Scrum.Methodology)
			{
				if (this.scrumMethodology === null)
				{
					this.scrumMethodology = new BX.Tasks.Scrum.Methodology({
						groupId: this.groupId,
						teamSpeedPath: this.urls.ScrumTeamSpeed,
						burnDownPath: this.urls.ScrumBurnDown
					});
				}

				this.scrumMethodology.showMenu(event.target);
			}
			BX.removeClass(event.target, 'ui-btn-wait');
		}.bind(this));

		event.preventDefault();
	};

	BX.BXSGM24.showProjectWidget = function(event)
	{
		if (this.projectWidgetInstance === null)
		{
			this.projectWidgetInstance = new BX.Socialnetwork.UIWorkgroupWidget({
				groupId: this.groupId,
				avatarPath: this.avatarPath,
				avatarType: this.avatarType,
				projectTypeCode: this.projectTypeCode,
				perms: {
					canModify: this.canModify,
				},
				urls: {
					card: this.urls.Card,
					members: this.urls.GroupUsers,
					features: this.urls.Features,
				},
			});
		}

		this.projectWidgetInstance.show(event.target);
		if (
			this.projectWidgetInstance.widget
			&& this.projectWidgetInstance.widget.getPopup()
		)
		{
			BX.UI.Hint.init(this.projectWidgetInstance.widget.getPopup().getContentContainer());
		}

		event.preventDefault();
	};

})();
