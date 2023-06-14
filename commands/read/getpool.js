// TODO: Clean up code
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatTVL } = require('../../utils');
const QuickChart = require('quickchart-js');
const axios = require('axios');

// Gets all chain TVLs and returns in format for discord inline fields for embeds.

module.exports = {
	data: new SlashCommandBuilder()
		.setName('getpool')
		.setDescription('Get historical APY and TVL of a pool')
		.addStringOption(option =>
			option.setName('pool')
				.setRequired(true)
				.setDescription('The pool symbol you want APY/TVL on')
				.setAutocomplete(true))
		.addBooleanOption(option =>
			option.setName('includechart')
				.setDescription('Include a historical chart of TVL and APY')),

	async execute(interaction) {
		const poolName = interaction.options.getString('pool');
		const includeChart = interaction.options.getBoolean('includechart');
		const [protocolData, protocolParent] = getProtocol(poolName);

		// TODO: Add checks to ensure data exists
		let embed;
		if (protocolData) {
			embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle(`${protocolData.name} (${protocolData.symbol})`)
				.setURL(protocolData.url)
				.addFields(
					{ name: 'Category', value: protocolData.category },
					{ name: 'Total Value Locked', value: formatTVL(protocolData.tvl, true) },
					...getTVLs(protocolData),
				)
				.setThumbnail(protocolData.logo);

			if (includeChart) {
				// const chartUrl = await buildTVLChart(protocolName);
				// console.log(chartUrl);
				// embed.setImage(chartUrl);
			}
			await interaction.reply({ embeds: [embed] });
		}
		else {
			// TODO: error
			await interaction.reply('Failed');
		}
	},
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const filtered = getProtocols().filter(protocol => protocol.toLowerCase().startsWith(focusedValue)).slice(0, 25);

		await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
	},
};