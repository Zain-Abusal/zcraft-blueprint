import { useState, useEffect } from 'react';
import { getSeoSettings, SeoSettings } from '@/services/settingsService';

export function useSeoSettings() {
  const [seoSettings, setSeoSettings] = useState<SeoSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSeoSettings();
        setSeoSettings(settings);
      } catch (error) {
        console.error('Failed to load SEO settings:', error);
        // Fallback to defaults
        setSeoSettings({
          title: "ZCraft Network — #1 Minecraft Lifesteal SMP & Skyblock Server | Join Now",
          description: "Join ZCraft Network, the ultimate Minecraft experience featuring lifesteal SMP, skyblock gameplay, competitive PvP, custom economy, factions, and active community. Best Minecraft server for lifesteal, skyblock, survival, and social gaming.",
          keywords: "zcraft network, minecraft lifesteal server, minecraft skyblock server, lifesteal smp, skyblock server, minecraft server, best minecraft server, minecraft factions, minecraft economy, minecraft pvp, minecraft survival server, minecraft community server, play minecraft lifesteal, play minecraft skyblock, z craft, zcraft mc, zcraft minecraft",
          image: "/zcraft.png",
          twitterHandle: "@ZCraftNetwork"
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  return { seoSettings, loading };
}