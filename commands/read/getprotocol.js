const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const QuickChart = require('quickchart-js');
const { getProtocols, getProtocol } = require('../../protocols');

const axios = require('axios');

function formatTVL(num, compact = false) {
	const formatter = Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		notation: compact ? 'compact' : 'standard',
		// notation: 'compact',
		// maximumFractionDigits: 0,
	});

	return formatter.format(num);
}

function getTVLs(protocolData) {
	const chains = protocolData.chains;
	const chainTvls = protocolData['chainTvls'];

	const data = [];
	for (let i = 0; i < chains.length; i++) {
		const chain = chainTvls[chains[i]];
		data.push({ name: chains[i] + ' TVL', value: formatTVL(chain.tvl), inline: true });
	}
	return data;
}

// Thanks https://quickchart.io/documentation/send-charts-discord-bot/
async function buildTVLChart(protocolName) {
	async function getHistoricalTVL() {
		try {
			const response = await axios.get(`https://api.llama.fi/protocol/${protocolName}`);
			const tvlData = response.data['tvl'];
			const result = tvlData.map(point => {
				return {
					label: new Date(point['date'] * 1000).toISOString().split('T')[0],
					data: point['totalLiquidityUSD'],
				};
			});
			return result;
		}
		catch (error) {
			console.error(error);
		}
	}
	const result = await getHistoricalTVL(protocolName);
	// We have to only display the last 243 datapoints due to QuickChart limitations
	const labels = result.map(item => item.label).slice(-243);
	const data = result.map(item => item.data).slice(-243);

	const chart = new QuickChart();
	const chartConfig = {
		type: 'line',
		data: {
			labels: labels,
			datasets: [{
				label: 'TVL for ' + protocolName,
				data: data,
				borderColor: 'rgba(75, 192, 192, 1)',
				fill: false,
			}],
		},
		options: {
			scales: {
				x: {
					type: 'time',
					time: {
						unit: 'day',
					},
				},
				yAxes: [{
					ticks: {
						callback: (val) => {
							return '$' + val.toLocaleString({ style:'currency', currency:'USD', notation: 'compact' });
						},
					},
				}],

			},
		},
	};
	chart.setConfig(chartConfig);
	const url = await chart.getShortUrl();
	return url;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('getprotocol')
		.setDescription('Get information about a protocol, including TVL')
		.addStringOption(option =>
			option.setName('protocol')
				.setRequired(true)
				.setDescription('The protocol you want information on')
				.setAutocomplete(true))
		.addBooleanOption(option =>
			option.setName('includechart')
				.setDescription('Include a historical chart of TVL. Included by default')),

	async execute(interaction) {
		const protocolName = interaction.options.getString('protocol');
		const includeChart = interaction.options.getBoolean('includechart');
		const [protocolData, protocolParent] = getProtocol(protocolName);

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

			if (protocolParent) {embed.setDescription(protocolParent.description);}

			if (includeChart) {
				const chartUrl = await buildTVLChart(protocolName);
				console.log(chartUrl);
				embed.setImage(chartUrl);
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