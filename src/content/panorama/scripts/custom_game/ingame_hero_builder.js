"use strict";

var util = GameUI.CustomUIConfig().Util;

// Have we spawned a hero builder?
var spawnedHeroBuilder = false;

var heroBuilderPanel = null;

function showIngameBuilder() {
    if(!spawnedHeroBuilder) {
        spawnedHeroBuilder = true;

        var balanceMode = GameUI.AbilityCosts.balanceModeEnabled == 1 ? true : false;

        // Spawn the hero builder
        try {
            heroBuilderPanel = $.GetContextPanel().GetParent().GetParent().GetParent().FindChildTraverse("CustomUIContainer_GameSetup").GetChild(0).GetChild(0);
            if (heroBuilderPanel != null) {
                heroBuilderPanel.SetParent($('#heroBuilderDisplay'))
            } else {
                throw true;
            }
        } catch (err) {
            heroBuilderPanel = $.CreatePanel('Panel', $('#heroBuilderDisplay'), '');
            heroBuilderPanel.BLoadLayout('file://{resources}/layout/custom_game/game_setup/game_setup.xml', false, false);
        }
        heroBuilderPanel.visible = true;
        heroBuilderPanel.isIngameBuilder = true;
        util.blockMouseWheel(heroBuilderPanel);

        // Boot it into selection mode
        // heroBuilderPanel.SetHasClass('phase_ingame', true);
        heroBuilderPanel.SetHasClass('phase_selection_selected', true);
        heroBuilderPanel.SetHasClass('phase_selection', true);
		heroBuilderPanel.SetHasClass('ingame_menu', true);
		heroBuilderPanel.SetHasClass('review_selection', false);
		heroBuilderPanel.SetHasClass('builder_enabled', util.builderEnabled);

        heroBuilderPanel.balanceMode = balanceMode;
        heroBuilderPanel.FindChildTraverse("balanceModeFilter").SetHasClass("balanceModeDisabled", true);
        for (var i = 0; i < GameUI.AbilityCosts.TIER_COUNT; ++i) {
            heroBuilderPanel.FindChildTraverse("buttonShowTier" + (i + 1) ).SetHasClass("balanceModeDisabled", balanceMode == false);
        }
        heroBuilderPanel.FindChildTraverse("balanceModePointsPreset").SetHasClass("balanceModeDisabled", balanceMode == false);
        heroBuilderPanel.FindChildTraverse("balanceModePointsHeroes").SetHasClass("balanceModeDisabled", balanceMode == false);
        heroBuilderPanel.FindChildTraverse("balanceModePointsSkills").SetHasClass("balanceModeDisabled", balanceMode == false);

        heroBuilderPanel.FindChildTraverse("tabsSelector").visible = true;

        heroBuilderPanel.FindChildTraverse("chat").visible = false;

        heroBuilderPanel.showBuilderTab('pickingPhaseMainTab');

        // Hide the hero selection when spawn hero is pressed
        GameEvents.Subscribe('lodNewHeroBuild', function() {
            $('#heroBuilderDisplay').visible = false;
        });

        // Make it visible
        $('#heroBuilderDisplay').visible = true;      
		
		util.reviewOptionsChange();
    } else {
        heroBuilderPanel.visible = true;
        $('#heroBuilderDisplay').visible = !$('#heroBuilderDisplay').visible;
    }

    //heroBuilderPanel.doActualTeamUpdate();
}

(function() {
    GameEvents.Subscribe('lodShowIngameBuilder', function() {
        showIngameBuilder();
    })
})();