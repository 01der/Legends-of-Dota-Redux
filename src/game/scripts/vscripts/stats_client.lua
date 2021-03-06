StatsClient = StatsClient or class({})
JSON = JSON or require("lib/json")

StatsClient.ServerAddress = (IsInToolsMode() and "http://127.0.0.1:3333" or "https://lodr-ark120202.rhcloud.com") .. "/lodServer/"
StatsClient.GameVersion = LoadKeyValues('addoninfo.txt').version

function StatsClient:SubscribeToClientEvents()
	CustomGameEventManager:RegisterListener("stats_client_create_skill_build", Dynamic_Wrap(StatsClient, "CreateSkillBuild"))
	CustomGameEventManager:RegisterListener("stats_client_remove_skill_build", Dynamic_Wrap(StatsClient, "RemoveSkillBuild"))
	CustomGameEventManager:RegisterListener("stats_client_vote_skill_build", Dynamic_Wrap(StatsClient, "VoteSkillBuild"))
	CustomGameEventManager:RegisterListener("stats_client_fav_skill_build", Dynamic_Wrap(StatsClient, "SetFavoriteSkillBuild"))
	CustomGameEventManager:RegisterListener("stats_client_save_fav_builds", Dynamic_Wrap(StatsClient, "SaveFavoriteBuilds"))
end

function StatsClient:CreateSkillBuild(args)
	local pregame = GameRules.pregame
	local playerID = args.PlayerID
	local steamID = tostring(PlayerResource:GetSteamID(playerID))
	local title = args.title or ""
	local description = args.description or ""
	local abilities = util:DeepCopy(pregame.selectedSkills[playerID]) or {}
	local heroName = pregame.selectedHeroes[playerID]
	local attribute = pregame.selectedPlayerAttr[playerID]
	for k,_ in pairs(abilities) do
		if tonumber(k) == nil then abilities[k] = nil end
	end
	if util:getTableLength(abilities) < 6 or not heroName or (attribute ~= "str" and attribute ~= "agi" and attribute ~= "int") then
		network:sendNotification(PlayerResource:GetPlayer(playerID), {
			sort = 'lodDanger',
			text = 'lodServerFailedCreateSkillBuildUnfinished'
		})
		pregame:PlayAlert(playerID)
		return
	end
	if #title < 4 or #title > 64 or #description < 10 or #description > 256 then
		network:sendNotification(PlayerResource:GetPlayer(playerID), {
			sort = 'lodDanger',
			text = 'lodServerFailedCreateSkillBuildText'
		})
		pregame:PlayAlert(playerID)
		return
	end
	StatsClient:Send("createSkillBuild", {
		steamID = steamID,
		title = title,
		description = description,
		abilities = abilities,
		heroName = heroName,
		attribute = attribute,
		tags = {},
	}, function(response)
		local player = PlayerResource:GetPlayer(playerID)
		if response.success then
			network:sendNotification(player, {
				sort = 'lodSuccess',
				text = 'lodServerSuccessCreateSkillBuild'
			})
			CustomGameEventManager:Send_ServerToPlayer(player, "lodReloadBuilds", {})
		else
			network:sendNotification(player, {
				sort = 'lodDanger',
				text = response.error or ''
			})
			pregame:PlayAlert(playerID)
		end
	end)
end

function StatsClient:RemoveSkillBuild(args)
	local playerID = args.PlayerID
	local steamID = tostring(PlayerResource:GetSteamID(playerID))
	local id = args.id
	if type(id) ~= "string" then
		return
	end
	StatsClient:Send("removeSkillBuild", {
		steamID = steamID,
		id = id,
	}, function(response)
		local player = PlayerResource:GetPlayer(playerID)
		if response.success then
			network:sendNotification(player, {
				sort = 'lodSuccess',
				text = 'lodServerSuccessRemoveSkillBuild'
			})
			CustomGameEventManager:Send_ServerToPlayer(player, "lodReloadBuilds", {})
		else
			network:sendNotification(player, {
				sort = 'lodDanger',
				text = response.error or ''
			})
			GameRules.pregame:PlayAlert(playerID)
		end
	end)
end

function StatsClient:VoteSkillBuild(args)
	StatsClient:Send("voteSkillBuild", {
		steamID = tostring(PlayerResource:GetSteamID(args.PlayerID)),
		id = args.id or "",
		vote = type(args.vote) == "number" and args.vote or 0
	})
end

function StatsClient:SetFavoriteSkillBuild(args)
	StatsClient:Send("setFavoriteSkillBuild", {
		steamID = tostring(PlayerResource:GetSteamID(args.PlayerID)),
		id = args.id or "",
		fav = type(args.fav) == "number" and args.fav or 0
	})
end

--[[function StatsClient:SaveFavoriteBuilds(args)
	local playerID = args.PlayerID
	local steamID = tostring(PlayerResource:GetSteamID(playerID))
	StatsClient:Send("updatePlayerData", {
		steamID = steamID,
		favoriteBuilds = type(args.builds) == "table" and args.builds or {}
	})
end]]

function StatsClient:Send(path, data, callback, retryCount, protocol, _currentRetry)
	local request = CreateHTTPRequestScriptVM(protocol or "POST", self.ServerAddress .. path)
	request:SetHTTPRequestGetOrPostParameter("data", JSON:encode(data))
	request:Send(function(response)
		if response.StatusCode ~= 200 or not response.Body then
			print("error, status == " .. response.StatusCode)
			local currentRetry = (_currentRetry or 0) + 1
			if currentRetry < (retryCount or 0) then
				Timers:CreateTimer(1, function()
					print("Retry (" .. currentRetry .. ")")
					StatsClient:Send(path, data, callback, retryCount, protocol, currentRetry)
				end)
			end
		else
			local obj, pos, err = JSON:decode(response.Body, 1, nil)
			if callback then
				callback(obj)
			end
		end
	end)
end