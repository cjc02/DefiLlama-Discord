const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('checkapi')
		.setDescription('Checks if DefiLlama API is up'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};
