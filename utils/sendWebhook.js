const axios = require('axios');

/**
 * Send Discord webhook notification
 * @param {string} webhookUrl - Discord webhook URL
 * @param {Object} payload - Discord webhook payload
 * @returns {Promise<boolean>} Success status
 */
const sendDiscordWebhook = async (webhookUrl, payload) => {
  try {
    if (!webhookUrl) {
      console.warn('⚠️ No webhook URL provided');
      return false;
    }

    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.status === 204) {
      console.log('✅ Discord webhook sent successfully');
      return true;
    } else {
      console.warn(`⚠️ Discord webhook returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending Discord webhook:', error.message);
    return false;
  }
};

/**
 * Create BuyBox change notification
 * @param {string} asin - Amazon ASIN
 * @param {string} oldSeller - Previous BuyBox holder
 * @param {string} newSeller - New BuyBox holder
 * @param {number} price - Current price
 * @param {string} currency - Currency code (default: 'GBP' for UK)
 * @param {boolean} isGain - Whether this is a gain or loss
 * @returns {Object} Discord webhook payload
 */
const createBuyBoxAlert = (asin, oldSeller, newSeller, price, currency = 'GBP', isGain = false) => {
  const emoji = isGain ? '✅' : '❌';
  const action = isGain ? 'gained' : 'lost';
  const color = isGain ? 0x00ff00 : 0xff0000;
  
  const embed = {
    title: `${emoji} BuyBox ${action.toUpperCase()}`,
    description: `**ASIN:** ${asin}`,
    color: color,
    fields: [
      {
        name: 'Previous Holder',
        value: oldSeller || 'None',
        inline: true
      },
      {
        name: 'New Holder',
        value: newSeller || 'None',
        inline: true
      }
    ],
    timestamp: new Date().toISOString()
  };

  if (price) {
    embed.fields.push({
      name: 'Price',
      value: `${currency} ${price}`,
      inline: true
    });
  }

  return {
    embeds: [embed]
  };
};

/**
 * Create estimated sale notification
 * @param {string} asin - Amazon ASIN
 * @param {string} sellerLabel - Seller label
 * @param {number} stockBefore - Stock level before
 * @param {number} stockAfter - Stock level after
 * @param {number} unitsSold - Estimated units sold
 * @param {string} productTitle - Product title (optional)
 * @returns {Object} Discord webhook payload
 */
const createSalesAlert = (asin, sellerLabel, stockBefore, stockAfter, unitsSold, productTitle = null) => {
  const embed = {
    title: '📉 Estimated Sale Detected',
    description: `**ASIN:** ${asin}`,
    color: 0xffa500,
    fields: [
      {
        name: 'Seller',
        value: sellerLabel,
        inline: true
      },
      {
        name: 'Stock Change',
        value: `${stockBefore} → ${stockAfter}`,
        inline: true
      },
      {
        name: 'Estimated Units Sold',
        value: unitsSold.toString(),
        inline: true
      }
    ],
    timestamp: new Date().toISOString()
  };

  if (productTitle) {
    embed.description += `\n**Product:** ${productTitle}`;
  }

  return {
    embeds: [embed]
  };
};

/**
 * Create system notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, warning, error)
 * @returns {Object} Discord webhook payload
 */
const createSystemAlert = (title, message, type = 'info') => {
  const emojis = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅'
  };

  const colors = {
    info: 0x0099ff,
    warning: 0xffa500,
    error: 0xff0000,
    success: 0x00ff00
  };

  const embed = {
    title: `${emojis[type]} ${title}`,
    description: message,
    color: colors[type],
    timestamp: new Date().toISOString()
  };

  return {
    embeds: [embed]
  };
};

/**
 * Send BuyBox change notification
 * @param {string} webhookUrl - Discord webhook URL
 * @param {Object} buyBoxData - BuyBox change data
 * @returns {Promise<boolean>} Success status
 */
const sendBuyBoxAlert = async (webhookUrl, buyBoxData) => {
  const { asin, oldSeller, newSeller, price, currency, isGain } = buyBoxData;
  const payload = createBuyBoxAlert(asin, oldSeller, newSeller, price, currency, isGain);
  return await sendDiscordWebhook(webhookUrl, payload);
};

/**
 * Send estimated sale notification
 * @param {string} webhookUrl - Discord webhook URL
 * @param {Object} salesData - Sales data
 * @returns {Promise<boolean>} Success status
 */
const sendSalesAlert = async (webhookUrl, salesData) => {
  const { asin, sellerLabel, stockBefore, stockAfter, unitsSold, productTitle } = salesData;
  const payload = createSalesAlert(asin, sellerLabel, stockBefore, stockAfter, unitsSold, productTitle);
  return await sendDiscordWebhook(webhookUrl, payload);
};

/**
 * Send system notification
 * @param {string} webhookUrl - Discord webhook URL
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @returns {Promise<boolean>} Success status
 */
const sendSystemAlert = async (webhookUrl, title, message, type = 'info') => {
  const payload = createSystemAlert(title, message, type);
  return await sendDiscordWebhook(webhookUrl, payload);
};

module.exports = {
  sendDiscordWebhook,
  sendBuyBoxAlert,
  sendSalesAlert,
  sendSystemAlert,
  createBuyBoxAlert,
  createSalesAlert,
  createSystemAlert
}; 