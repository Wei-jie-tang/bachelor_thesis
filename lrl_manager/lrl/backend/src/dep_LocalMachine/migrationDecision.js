// each runtime has a list of actors running on it. Each actor is running in only one runtime (node)

// next step: pg 48, check if actor status is infoupdate or not

'use strict';
const { performTOPSIS } = require('./topsis');

function isCandidate(node, requirements) {
  let required = Object.values(requirements);
  let available = Object.values(node.resourceStatus);
  required.forEach((val, i) => {
    if (val > available[i]) return false;
  })
  return true;
}

exports.migrationDecision = function (requirements, nodes, caller) {



    // query to get list of possible candidate nodes for migration of actor
    // important features of the nodes:
    // runningStatus == 'operational'
    // node != currentNode (the node from where the actor is leaving)
    // CPU_Availabilty_percentage > 20%
    // RAM_Available_GB > 2GB
    // nwBWUtilization < 80%

    var candidates = []
    for (let node of nodes) {
        if (node.address == caller) continue;
        if (isCandidate(node, requirements)) candidates.push(node);
    }
    
    // var candidateNodes = candidates.map(({ ID, docType, runningStatus, nodeIP, assetList, , ...item }) => item);
    
    var resources = candidates.map(node=>node.resourceStatus);


    // Create TOPSIS matrix
    // dataMatrix is made by several pushs of runtimeResources, one for each node

    // Creation of dataMatrix, which gathers data from nodes
    var dataMatrix = []
    for (let resourceObject of resources) 
      dataMatrix.push(Object.values(resourceObject));   //  dataMatrix = [[cpu, clock, ram, nwBWU, RTT_ms, cores, nwBW], ... ... ]  

    // // node variables to be considered in the node selection for actor migration are:
    // // . CPU_Availabilty_percentage *
    // // . Clock_Rate_GHz, 
    // // . RAM_Available_GB,
    // // . nwBWUtilization, 
    // // . RTT_ms, 
    // // . Cores, 
    // // . nwBW

    // // Performing TOPSIS in order to choose the node to which the actors should be migrated
    // // in the benefitMatrix, when 1: variable is beneficial. When 0, variable is maleficial and doesnt help node to be chosen
    var benefitMatrix = [1, 1, 1, 0, 0, 1, 1];
    var weightMatrix = [0.15, 0.1, 0.15, 0.15, 0.15, 0.15, 0.15];
    // weightMatrix = [0,0,0,0,1,0]
    let topsisResult = performTOPSIS(dataMatrix, weightMatrix, benefitMatrix);

    let chosenNode = topsisResult.indexOf(Math.max.apply(null, topsisResult));
    let result = [candidates[chosenNode].address, candidates[chosenNode].IP];
    return result;
}
