// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
//import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

contract LRLAsset is ERC721URIStorage, ERC721Enumerable {
  //using Counters for Counters.Counter;
  using Strings for uint256;
  using EnumerableMap for EnumerableMap.UintToAddressMap;

  event NewNode(address indexed addr, string IP, string resources);
  event NewAsset(uint256 indexed ID, address indexed owner, string requirements);
  event InheritorChosen(address indexed addr, uint256 indexed assetID); 
  event TestamentorChosen(address indexed addr, uint256 indexed assetID);
  event ECDHPublicKeyStored(address indexed node, string publicKey);
  event EncryptedTokenStored(address indexed node, string encryptedToken);

  struct Resources {
    uint cpu_pct;
    uint clockrate_GHz;
    uint ram_GB;
    uint networkBandwidth_utilization;
    uint RTT_ms;
    uint cores;
    uint networkBandwidth;
  }

  //Counters.Counter private _assetIds;
  uint256 private _assetIds;

  mapping (address => bool) private _allNodes;
  mapping (address => string) private _publicKeys;
  mapping (uint256 => address[]) private _testamentors;
  mapping (uint256 => address) private _inheritor;
  mapping (address => Resources) private _resources;
  mapping (uint256 => address) private _originalOwner;
  mapping (uint256 => bytes32) private _password;
  mapping(address => string) private _ecdhPublicKeys;
 
  mapping(address => string) private _encryptedTokens;


  modifier onlyOriginalOwner(uint256 assetID) {
    require(msg.sender == _originalOwner[assetID]);
    _;
  }

  modifier onlyOwner(uint256 assetID) {
    require(msg.sender == ownerOf(assetID));
    _;
  }

  constructor() ERC721("LRLAsset", "LRL") {} 

  function storeECDHPublicKey(address node, string memory publicKey) external {
        require(_nodeExists(node), "Node not registered");
        _ecdhPublicKeys[node] = publicKey;
        emit ECDHPublicKeyStored(node, publicKey);
    }

  function getECDHPublicKey(address node) external view returns (string memory) {
        require(bytes(_ecdhPublicKeys[node]).length > 0, "Public key not found");
        return _ecdhPublicKeys[node];
    }
  function storeEncryptedToken(string memory encryptedToken) external {
        require(_nodeExists(msg.sender), "Sender is not a registered node");

        _encryptedTokens[msg.sender] = encryptedToken;
        emit EncryptedTokenStored(msg.sender, encryptedToken);
    }
  function getEncryptedToken() external view returns (string memory) {
        require(bytes(_encryptedTokens[msg.sender]).length > 0, "No encrypted token found");
        return _encryptedTokens[msg.sender];
    }


  // Contract Interface
  function registerNode(
    string memory IP, 
    uint cpu_pct,
    uint clockrate_GHz,
    uint ram_GB,
    uint networkBandwidth_utilization,
    uint RTT_ms,
    uint cores,
    uint networkBandwidth
  ) external {
    require(!_nodeExists(msg.sender), "Node ID already registered");
    address newNode = msg.sender;
    _allNodes[newNode] = true;
    _resources[newNode] = Resources(cpu_pct, clockrate_GHz, ram_GB, networkBandwidth_utilization, RTT_ms, cores, networkBandwidth);
    emit NewNode(newNode, IP, _getNodeResources(newNode));
  }

  function registerAsset(
    address to, 
    uint cpu_pct,
    uint clockrate_GHz,
    uint ram_GB,
    uint networkBandwidth_utilization,
    uint RTT_ms,
    uint cores,
    uint networkBandwidth
  ) external {
    require(_nodeExists(to), "Node not Registered with Smartcontract.");
    // mint new Asset
    //_assetIds.increment();
    //uint256 assetID = _assetIds.current();
    _assetIds++;
    uint256 assetID = _assetIds;

    _safeMint(to, assetID);  // Emits Transfer Event
    // set Original Owner
    _originalOwner[assetID] = to;
    // set Asset Requirements
    _setTokenURI(assetID, _getDataURI(cpu_pct, clockrate_GHz, ram_GB, networkBandwidth_utilization, RTT_ms, cores, networkBandwidth));   
    emit NewAsset(assetID, to, tokenURI(assetID));
  }

  function setTestamentor(uint256 assetID, address testamentor) public onlyOwner(assetID) {
    require (_exists(assetID), "Asset does not exist.");
    _testamentors[assetID].push(testamentor);
    approve(testamentor, assetID);
    emit TestamentorChosen(testamentor, assetID);
  }

  function getTestamentors(uint256 assetID) external view returns (address[] memory) {
    require(_exists(assetID), "Asset does not exist.");
    return _testamentors[assetID];
    }
  function setInheritor(uint256 assetID, address inheritor) public onlyOwner(assetID) {
    require (_exists(assetID), "Asset does not exist.");
    _inheritor[assetID] = inheritor;
    emit InheritorChosen(inheritor, assetID);
  }
  function getInheritor(uint256 assetID) external view returns (address) {
    require(_exists(assetID), "Asset does not exist.");
    return _inheritor[assetID];
    }

  function setPassword(uint256 assetID, bytes32 pw_hash) public onlyOwner(assetID) {
    _password[assetID] = pw_hash;
  }

  function transferToOriginalOwner(uint256 assetID) public onlyOriginalOwner(assetID) {
    _transfer(ownerOf(assetID), msg.sender, assetID);
  }

  // Overrides
  function transferAsset(uint256 assetID, address to, bytes calldata password) public {
    require(_isInheritor(assetID, to), "recipient of is not the Inheritor");
    require(sha256(password) == _password[assetID], "password is not correct");

    address currentOwner = ownerOf(assetID);
    address inheritor = _inheritor[assetID];
    _transfer(currentOwner, inheritor, assetID);
  }

  function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
    return super.tokenURI(tokenId);
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 firstTokenId,
    uint256 batchSize
  ) internal virtual override(ERC721, ERC721Enumerable) { 
    super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
  }

  function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721URIStorage) {
    super._burn(tokenId);
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable, ERC721URIStorage) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  // Internal functions
  function _nodeExists(address _address) private view returns (bool) {
    return _allNodes[_address];
  }

  function _isTestamentor(uint256 assetID, address addr) internal view returns (bool) {
    for (uint i = 0; i < _testamentors[assetID].length; i++) {
      if (addr == _testamentors[assetID][i]) {
        return true;
      } 
    }
    return false;
  }

  function _isInheritor(uint256 assetID, address addr) internal view returns (bool) {
    return (_inheritor[assetID] == addr);
  }

  function _getNodeResources(address nodeId) internal view returns (string memory) {
    bytes memory resources = abi.encodePacked(
      '{',
        '"cpu_pct": ', Strings.toString(_resources[nodeId].cpu_pct), ', ',
        '"clockrate_GHz": ', Strings.toString(_resources[nodeId].clockrate_GHz), ', ',
        '"ram_GB": ', Strings.toString(_resources[nodeId].ram_GB), ', ',
        '"networkBandwidth_utilization": ', Strings.toString(_resources[nodeId].networkBandwidth_utilization), ', ',
        '"RTT_ms": ', Strings.toString(_resources[nodeId].RTT_ms), ', ',
        '"cores": ', Strings.toString(_resources[nodeId].cores), ', ',
        '"networkBandwidth": ', Strings.toString(_resources[nodeId].networkBandwidth), 
      '}'
    );
    return string(resources);
  }

  function _getDataURI(uint cpu_pct, uint clockrate_GHz, uint ram_GB, uint networkBandwidth_utilization, uint RTT_ms, uint cores, uint networkBandwidth) internal pure returns (string memory) {
    bytes memory dataURI = abi.encodePacked(
      '{',
        '"cpu_pct": ', Strings.toString(cpu_pct), ', ',
        '"clockrate_GHz": ', Strings.toString(clockrate_GHz), ', ',
        '"ram_GB": ', Strings.toString(ram_GB), ', ',
        '"networkBandwidth_utilization": ', Strings.toString(networkBandwidth_utilization), ', ',
        '"RTT_ms": ', Strings.toString(RTT_ms), ', '
        '"cores": ', Strings.toString(cores), ', '
        '"networkBandwidth": ', Strings.toString(networkBandwidth),
      '}'
    );
    return string(dataURI); 
  }
  function getEncryptedToken(address node) external view returns (string memory) {
    require(_nodeExists(node), "Node not registered");
    require(bytes(_encryptedTokens[node]).length > 0, "No encrypted token found for this node");
    return _encryptedTokens[node];
}

}
