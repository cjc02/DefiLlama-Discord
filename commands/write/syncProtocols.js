// TODO: Redo this
const { SlashCommandBuilder } = require('discord.js');
const { syncProtocols } = require('../../protocols');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('syncprotocols')
		.setDescription('Syncs the discord bot with all supported DefiLlama protocols.'),
	async execute(interaction) {
		try {
			const success = await syncProtocols();
			if (success) {
				// TODO: Build embeds
				await interaction.reply('passed');
			}
			else {
				await interaction.reply('failed');
			}
		}
		catch (error) {
			await interaction.reply('failed');
			console.error(error);
		}
	},
};
