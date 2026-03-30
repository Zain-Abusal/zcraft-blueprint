import { supabase } from '@/integrations/supabase/client';
import { sendWebhook, WebhookEvent } from './webhookService';

export interface AdminSettings {
  id: string;
  key: string;
  value: string;
  updated_at: string | null;
}

export async function getSettings() {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('*');

  if (error) throw error;
  return (data || []) as AdminSettings[];
}

export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.value || null;
}

export async function setSetting(key: string, value: string) {
  // Check if setting exists
  const { data: existing } = await supabase
    .from('admin_settings')
    .select('id')
    .eq('key', key)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('admin_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
      .select()
      .single();

    if (error) throw error;

    // Send webhook for setting update
    await sendWebhook(WebhookEvent.ADMIN_SETTING_UPDATED, {
      settingId: data.id,
      key: data.key,
      updatedAt: data.updated_at,
    });
  } else {
    const { data, error } = await supabase
      .from('admin_settings')
      .insert({
        key,
        value,
      })
      .select()
      .single();

    if (error) throw error;

    // Send webhook for setting creation
    await sendWebhook(WebhookEvent.ADMIN_SETTING_CREATED, {
      settingId: data.id,
      key: data.key,
    });
  }
}

export async function getDiscordLink(): Promise<string | null> {
  return getSetting('discord_link');
}

export async function setDiscordLink(link: string) {
  await setSetting('discord_link', link);
}

export async function deleteSetting(key: string) {
  // Get setting info before deleting
  const settingData = await getSetting(key);
  
  const { error } = await supabase
    .from('admin_settings')
    .delete()
    .eq('key', key);

  if (error) throw error;

  // Send webhook for setting deletion
  if (settingData !== null) {
    await sendWebhook(WebhookEvent.ADMIN_SETTING_DELETED, {
      key,
    });
  }
}

// SEO-specific functions
export interface SeoSettings {
  title: string;
  description: string;
  keywords: string;
  image: string;
  twitterHandle: string;
  facebookAppId?: string;
  googleSiteVerification?: string;
}

export async function getSeoSettings(): Promise<SeoSettings> {
  const [
    title,
    description,
    keywords,
    image,
    twitterHandle,
    facebookAppId,
    googleSiteVerification
  ] = await Promise.all([
    getSetting('seo_title'),
    getSetting('seo_description'),
    getSetting('seo_keywords'),
    getSetting('seo_image'),
    getSetting('seo_twitter_handle'),
    getSetting('seo_facebook_app_id'),
    getSetting('seo_google_site_verification')
  ]);

  return {
    title: title || "ZCraft Network — #1 Minecraft Lifesteal SMP & Skyblock Server | Join Now",
    description: description || "Join ZCraft Network, the ultimate Minecraft experience featuring lifesteal SMP, skyblock gameplay, competitive PvP, custom economy, factions, and active community. Best Minecraft server for lifesteal, skyblock, survival, and social gaming.",
    keywords: keywords || "zcraft network, minecraft lifesteal server, minecraft skyblock server, lifesteal smp, skyblock server, minecraft server, best minecraft server, minecraft factions, minecraft economy, minecraft pvp, minecraft survival server, minecraft community server, play minecraft lifesteal, play minecraft skyblock, z craft, zcraft mc, zcraft minecraft",
    image: image || "/zcraft.png",
    twitterHandle: twitterHandle || "@ZCraftNetwork",
    facebookAppId: facebookAppId || undefined,
    googleSiteVerification: googleSiteVerification || undefined
  };
}

export async function updateSeoSettings(settings: Partial<SeoSettings>) {
  const updates = [];

  if (settings.title !== undefined) {
    updates.push(setSetting('seo_title', settings.title));
  }
  if (settings.description !== undefined) {
    updates.push(setSetting('seo_description', settings.description));
  }
  if (settings.keywords !== undefined) {
    updates.push(setSetting('seo_keywords', settings.keywords));
  }
  if (settings.image !== undefined) {
    updates.push(setSetting('seo_image', settings.image));
  }
  if (settings.twitterHandle !== undefined) {
    updates.push(setSetting('seo_twitter_handle', settings.twitterHandle));
  }
  if (settings.facebookAppId !== undefined && settings.facebookAppId) {
    updates.push(setSetting('seo_facebook_app_id', settings.facebookAppId));
  } else if (settings.facebookAppId === '') {
    updates.push(deleteSetting('seo_facebook_app_id'));
  }
  if (settings.googleSiteVerification !== undefined && settings.googleSiteVerification) {
    updates.push(setSetting('seo_google_site_verification', settings.googleSiteVerification));
  } else if (settings.googleSiteVerification === '') {
    updates.push(deleteSetting('seo_google_site_verification'));
  }

  await Promise.all(updates);
}

export const settingsService = {
  getSettings,
  getSetting,
  setSetting,
  deleteSetting,
  getDiscordLink,
  setDiscordLink,
};
