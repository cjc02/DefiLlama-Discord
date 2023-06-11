const fs = require('fs');
const axios = require('axios');

let protocols = [];

function getProtocols() {
	return protocols;
}

function getProtocol(protocolName) {
	try {
		const data = fs.readFileSync('./protocols.json', 'utf8');
		const protocolJSON = JSON.parse(data);
		let protocolData, protocolParent;

		for (const protocol of protocolJSON.protocols) {
			if (protocol.name === protocolName) {
				protocolData = protocol;
				// If there is a protocol parent that exists, we want to return it.
				if (protocolData.parentProtocol) {
					for (const parentProtocol of protocolJSON.parentProtocols) {
						if (parentProtocol.id === protocolData.parentProtocol) {
							protocolParent = parentProtocol;
						}
					}
					return [protocolData, protocolParent];
				}
				else {
					return [protocolData];
				}
			}
		}

		return [protocolData, protocolParent];
	}
	catch (err) {
		console.error(`Error reading file from disk: ${err}`);
	}
}

// Dev function, just so we don't have to make unnecessary API calls
function updateKeys() {
	const protocolsJSON = JSON.parse(fs.readFileSync('./protocols.json', 'utf8'));
	protocols = protocolsJSON.protocols.map(protocol => protocol.name);
}

// Updates the list of protocols
async function syncProtocols() {
	try {
		const response = await axios.get('https://api.llama.fi/lite/protocols2');
		fs.writeFileSync('./protocols.json', JSON.stringify(response.data));
		// protocols = response.data.protocols.map(protocol => protocol.name);
		updateKeys();
		console.log(protocols);
	}
	catch (error) {
		console.error(error);
		return false;
	}
	return true;
}

module.exports = {
	updateKeys,
	getProtocol,
	syncProtocols,
	getProtocols,
};