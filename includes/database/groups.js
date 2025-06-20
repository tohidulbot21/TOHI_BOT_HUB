
module.exports = function({ api }) {
  const fs = require("fs-extra");
  const path = require("path");
  
  const configPath = path.join(__dirname, "../../config.json");
  const groupsDataPath = path.join(__dirname, "data/groupsData.json");
  
  // Initialize groups data file if not exists
  if (!fs.existsSync(groupsDataPath)) {
    fs.writeFileSync(groupsDataPath, JSON.stringify({}, null, 2));
  }
  
  const Groups = {
    // Get all groups data
    getAll: function() {
      try {
        return JSON.parse(fs.readFileSync(groupsDataPath, "utf8"));
      } catch (error) {
        console.error("Error reading groups data:", error);
        return {};
      }
    },
    
    // Get specific group data
    getData: function(threadID) {
      const allGroups = this.getAll();
      return allGroups[threadID] || null;
    },
    
    // Set group data
    setData: function(threadID, data) {
      try {
        const allGroups = this.getAll();
        allGroups[threadID] = {
          ...allGroups[threadID],
          ...data,
          lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(groupsDataPath, JSON.stringify(allGroups, null, 2));
        return true;
      } catch (error) {
        console.error("Error setting group data:", error);
        return false;
      }
    },
    
    // Create new group data
    createData: async function(threadID) {
      try {
        const groupInfo = await api.getThreadInfo(threadID);
        const groupData = {
          threadID: threadID,
          threadName: groupInfo.threadName || "Unknown Group",
          memberCount: groupInfo.participantIDs ? groupInfo.participantIDs.length : 0,
          isApproved: false,
          isPending: false,
          isRejected: false,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          adminList: groupInfo.adminIDs || [],
          settings: {
            allowCommands: false,
            autoApprove: false
          }
        };
        
        this.setData(threadID, groupData);
        return groupData;
      } catch (error) {
        console.error("Error creating group data:", error);
        return null;
      }
    },
    
    // Approve group
    approveGroup: function(threadID) {
      try {
        // Update config.json
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (!config.APPROVAL) {
          config.APPROVAL = { approvedGroups: [], pendingGroups: [], rejectedGroups: [] };
        }
        
        // Add to approved list
        if (!config.APPROVAL.approvedGroups.includes(threadID)) {
          config.APPROVAL.approvedGroups.push(threadID);
        }
        
        // Remove from pending and rejected lists
        config.APPROVAL.pendingGroups = config.APPROVAL.pendingGroups.filter(id => id !== threadID);
        config.APPROVAL.rejectedGroups = config.APPROVAL.rejectedGroups.filter(id => id !== threadID);
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        // Update groups data
        this.setData(threadID, {
          isApproved: true,
          isPending: false,
          isRejected: false,
          approvedAt: new Date().toISOString(),
          settings: {
            allowCommands: true,
            autoApprove: false
          }
        });
        
        return true;
      } catch (error) {
        console.error("Error approving group:", error);
        return false;
      }
    },
    
    // Reject group
    rejectGroup: function(threadID) {
      try {
        // Update config.json
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (!config.APPROVAL) {
          config.APPROVAL = { approvedGroups: [], pendingGroups: [], rejectedGroups: [] };
        }
        
        // Add to rejected list
        if (!config.APPROVAL.rejectedGroups.includes(threadID)) {
          config.APPROVAL.rejectedGroups.push(threadID);
        }
        
        // Remove from approved and pending lists
        config.APPROVAL.approvedGroups = config.APPROVAL.approvedGroups.filter(id => id !== threadID);
        config.APPROVAL.pendingGroups = config.APPROVAL.pendingGroups.filter(id => id !== threadID);
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        // Update groups data
        this.setData(threadID, {
          isApproved: false,
          isPending: false,
          isRejected: true,
          rejectedAt: new Date().toISOString(),
          settings: {
            allowCommands: false,
            autoApprove: false
          }
        });
        
        return true;
      } catch (error) {
        console.error("Error rejecting group:", error);
        return false;
      }
    },
    
    // Add to pending
    addToPending: function(threadID) {
      try {
        // Update config.json
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (!config.APPROVAL) {
          config.APPROVAL = { approvedGroups: [], pendingGroups: [], rejectedGroups: [] };
        }
        
        // Add to pending list
        if (!config.APPROVAL.pendingGroups.includes(threadID)) {
          config.APPROVAL.pendingGroups.push(threadID);
        }
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        // Update groups data
        this.setData(threadID, {
          isApproved: false,
          isPending: true,
          isRejected: false,
          pendingAt: new Date().toISOString(),
          settings: {
            allowCommands: false,
            autoApprove: false
          }
        });
        
        return true;
      } catch (error) {
        console.error("Error adding to pending:", error);
        return false;
      }
    },
    
    // Check if group is approved
    isApproved: function(threadID) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        return config.APPROVAL && config.APPROVAL.approvedGroups && config.APPROVAL.approvedGroups.includes(threadID);
      } catch (error) {
        return false;
      }
    },
    
    // Check if group is pending
    isPending: function(threadID) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        return config.APPROVAL && config.APPROVAL.pendingGroups && config.APPROVAL.pendingGroups.includes(threadID);
      } catch (error) {
        return false;
      }
    },
    
    // Check if group is rejected
    isRejected: function(threadID) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        return config.APPROVAL && config.APPROVAL.rejectedGroups && config.APPROVAL.rejectedGroups.includes(threadID);
      } catch (error) {
        return false;
      }
    },
    
    // Sync with config.json
    syncWithConfig: function() {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (!config.APPROVAL) return;
        
        const allGroups = this.getAll();
        
        // Update approved groups
        if (config.APPROVAL.approvedGroups) {
          config.APPROVAL.approvedGroups.forEach(threadID => {
            if (!allGroups[threadID]) {
              this.createData(threadID);
            }
            this.setData(threadID, {
              isApproved: true,
              isPending: false,
              isRejected: false,
              settings: { allowCommands: true }
            });
          });
        }
        
        // Update pending groups
        if (config.APPROVAL.pendingGroups) {
          config.APPROVAL.pendingGroups.forEach(threadID => {
            if (!allGroups[threadID]) {
              this.createData(threadID);
            }
            this.setData(threadID, {
              isApproved: false,
              isPending: true,
              isRejected: false,
              settings: { allowCommands: false }
            });
          });
        }
        
        // Update rejected groups
        if (config.APPROVAL.rejectedGroups) {
          config.APPROVAL.rejectedGroups.forEach(threadID => {
            if (!allGroups[threadID]) {
              this.createData(threadID);
            }
            this.setData(threadID, {
              isApproved: false,
              isPending: false,
              isRejected: true,
              settings: { allowCommands: false }
            });
          });
        }
        
        return true;
      } catch (error) {
        console.error("Error syncing with config:", error);
        return false;
      }
    },
    
    // Get groups by status
    getByStatus: function(status) {
      const allGroups = this.getAll();
      const result = [];
      
      for (const [threadID, groupData] of Object.entries(allGroups)) {
        if (status === 'approved' && groupData.isApproved) {
          result.push({ threadID, ...groupData });
        } else if (status === 'pending' && groupData.isPending) {
          result.push({ threadID, ...groupData });
        } else if (status === 'rejected' && groupData.isRejected) {
          result.push({ threadID, ...groupData });
        }
      }
      
      return result;
    },
    
    // Remove group completely
    removeGroup: function(threadID) {
      try {
        // Remove from config.json
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (config.APPROVAL) {
          config.APPROVAL.approvedGroups = config.APPROVAL.approvedGroups.filter(id => id !== threadID);
          config.APPROVAL.pendingGroups = config.APPROVAL.pendingGroups.filter(id => id !== threadID);
          config.APPROVAL.rejectedGroups = config.APPROVAL.rejectedGroups.filter(id => id !== threadID);
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        }
        
        // Remove from groups data
        const allGroups = this.getAll();
        delete allGroups[threadID];
        fs.writeFileSync(groupsDataPath, JSON.stringify(allGroups, null, 2));
        
        return true;
      } catch (error) {
        console.error("Error removing group:", error);
        return false;
      }
    }
  };
  
  // Auto sync on initialization
  setTimeout(() => {
    Groups.syncWithConfig();
  }, 1000);
  
  return Groups;
};
