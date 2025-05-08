const fs = require('fs');
const path = require('path');
const { RichPresence } = require('discord.js-selfbot-v13');

class RPCHandler {
    constructor(client) {
        this.client = client;
        this.dataPath = path.join(__dirname, '../data/RPCData.json');
        this.ensureDataFile();
    }

    ensureDataFile() {
        const dataDir = path.dirname(this.dataPath);
        
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.dataPath)) {
            fs.writeFileSync(this.dataPath, JSON.stringify({}, null, 2));
        }
    }

    loadRPCData() {
        try {
            const data = fs.readFileSync(this.dataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading RPC data:', error);
            return {};
        }
    }

    saveRPCData(data) {
        try {
            fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving RPC data:', error);
            return false;
        }
    }

    createRPC(name, details, largeImageURL, smallImageURL, type = 'PLAYING', state = '', buttonName = '', buttonURL = '', buttonName2 = '', buttonURL2 = '') {
        const rpcData = this.loadRPCData();
        
        rpcData[name] = {
            name,
            details,
            largeImageURL,
            smallImageURL,
            type,
            state,
            buttons: []
        };
        
        // Add buttons if provided
        if (buttonName && buttonURL) {
            rpcData[name].buttons.push({ name: buttonName, url: buttonURL });
        }
        
        if (buttonName2 && buttonURL2) {
            rpcData[name].buttons.push({ name: buttonName2, url: buttonURL2 });
        }
        
        return this.saveRPCData(rpcData);
    }

    activateRPC(name) {
        const rpcData = this.loadRPCData();
        
        if (!rpcData[name]) {
            return { success: false, message: `RPC with name "${name}" not found.` };
        }
        
        const rpcConfig = rpcData[name];
        try {
            const rpc = new RichPresence(this.client)
                .setType(rpcConfig.type)
                .setName(rpcConfig.name)
                .setDetails(rpcConfig.details)
                .setStartTimestamp(Date.now());
            
            if (rpcConfig.state) {
                rpc.setState(rpcConfig.state);
            }
            
            if (rpcConfig.largeImageURL) {
                rpc.setAssetsLargeImage(rpcConfig.largeImageURL);
                rpc.setAssetsLargeText(rpcConfig.name);
            }
            
            if (rpcConfig.smallImageURL) {
                rpc.setAssetsSmallImage(rpcConfig.smallImageURL);
                rpc.setAssetsSmallText(rpcConfig.details);
            }
            
            if (rpcConfig.buttons && rpcConfig.buttons.length > 0) {
                rpcConfig.buttons.forEach(button => {
                    rpc.addButton(button.name, button.url);
                });
            }
            
            this.client.user.setActivity(rpc.toJSON());
            return { success: true, message: `RPC "${name}" has been activated.` };
        } catch (error) {
            console.error('Error activating RPC:', error);
            return { success: false, message: `Failed to activate RPC: ${error.message}` };
        }
    }

    listRPCs() {
        return Object.keys(this.loadRPCData());
    }

    deleteRPC(name) {
        const rpcData = this.loadRPCData();
        
        if (!rpcData[name]) {
            return { success: false, message: `RPC with name "${name}" not found.` };
        }
        
        delete rpcData[name];
        const saved = this.saveRPCData(rpcData);
        
        return { 
            success: saved, 
            message: saved ? `RPC "${name}" has been deleted.` : 'Failed to delete RPC.'
        };
    }
}

module.exports = RPCHandler;