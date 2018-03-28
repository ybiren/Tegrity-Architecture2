/***************************************************************\
|* FILE: XmlUtils.js																					 *|
|* DESC: Cross platform xml reading utility.									 *|
|*																														 *|
|* AUTH: Aviram Iny																						 *|
|* CONTRIBUTORS: Harel Gruia																	 *|
|* DATE: 21/02/2006																						 *|
|*									Copyright Tegrity Ltd 2008								 *|
\***************************************************************/

// Browser Types.
var BT_OTHER = 0;
var BT_IE		 = 1;
var BT_FF		 = 2;
var BT_SF		 = 3;
var BT_CR		 = 4;
var sIE			 = "MSIE";
var sFF			 = "Firefox";
var sSF			 = "Safari";
var sCR			 = "Chrome";
var BROWSER_TYPE = BT_OTHER; // Init to default.

//-----------------------------------------------------------------------
// Exception Types.
var ET_InvalidArg = 1;
var ET_InitFailed = 2;
var ET_CallFailed = 3;
function TegException(nExpType,sExpDesc)
{
	this.name				 = "Error";
	this.number			 = this.type		= nExpType;
	this.description = this.message = sExpDesc;
	 
	this.toString = function(){return this.description;}
} // TegException

//-----------------------------------------------------------------------
function InitXmlFunctionsByBrowser(sUserAgent)
{
	// Look for the Browser type.
	if(sUserAgent.indexOf(sIE) != -1) 
		BROWSER_TYPE = BT_IE;
	else if(sUserAgent.indexOf(sFF) != -1)
		BROWSER_TYPE = BT_FF;
	else if((sUserAgent.indexOf(sSF) != -1) && (sUserAgent.indexOf(sCR) == -1))
		BROWSER_TYPE = BT_SF;
	else if(sUserAgent.indexOf(sCR) != -1)
		BROWSER_TYPE = BT_CR;

	// Init Xml functions.
	switch(BROWSER_TYPE)
	{
		case BT_IE:
			LoadXmlFile				= LoadXmlFile_IE;
			SelectSingleNode	= SelectSingleNode_IE_FF;
			SelectNodes				= SelectNodes_IE_FF;
			GetNodeInnerText	= GetNodeInnerText_IE;
			GetNodeInnerXml		= GetNodeInnerXml_IE;
			break;
		case BT_CR:
		case BT_FF:
			DefineSelectNodes_FF();
			DefineSelectSingleNode_FF();
			DefineOuterHTML_FF();
			LoadXmlFile				= LoadXmlFile_FF_SF;
			SelectSingleNode	= SelectSingleNode_IE_FF;
			SelectNodes				= SelectNodes_IE_FF;
			GetNodeInnerText	= GetNodeInnerText_FF;
			GetNodeInnerXml		= GetNodeInnerXml_FF;
			break;
		case BT_SF:
			document.write('<script type="text/javascript" src="XmlDocImp.js"></script>');
			LoadXmlFile				= LoadXmlFile_FF_SF;
			SelectSingleNode	= SelectSingleNode_SF;
			SelectNodes				= SelectNodes_SF;
			GetNodeInnerText	= GetNodeInnerText_SF;
			GetNodeInnerXml		= GetNodeInnerXml_SF;
			break;
		default:
			throw new TegException(ET_InvalidArg,"This browser is unsupported.");
			break;
	}
} // SetBrowserXmlFunctions 

// Init the Xml functions.
InitXmlFunctionsByBrowser(navigator.userAgent);

//===========================================================================
//|													GetXmlDomProgID																	|
//===========================================================================
var g_sXmlDomProgID = "";
function GetXmlDomProgID()
{
	if(g_sXmlDomProgID)
		return g_sXmlDomProgID;
	
	var i = 0, obj	= null;
	var sProgids = new Array(	"Msxml2.DOMDocument.6.0", // MSXML 6.0 
														"Msxml2.DOMDocument.4.0",	// MSXML 4.0
														"Msxml2.DOMDocument.3.0",	// MSXML 3.0
														"Msxml.DOMDocument",			// MSXML 2.x
														"Microsoft.XMLDOM");			// Default ver.
	
	for(i=0; i < sProgids.length; i++)
	{
		try
		{
			obj = new ActiveXObject(sProgids[i]);
			obj = null;
			g_sXmlDomProgID = sProgids[i];
			break;
		}
		catch(e){};
	}
	return g_sXmlDomProgID;
} // GetXmlDomProgID

//===========================================================================
//|														LoadXmlFile																		|
//===========================================================================
//----------------------------------------------------------------------- 
function LoadXmlFile_IE(sXmlPath)
{	
	try
	{
		var oXmlDoc = new ActiveXObject(GetXmlDomProgID());
		oXmlDoc.setProperty("SelectionLanguage", "XPath"); // Set XPath as the selection language. (The default in IE7 is "XSLPattern")
		oXmlDoc.async = false; // Set to synchronous mode.
		oXmlDoc.load(sXmlPath);
		
		if(oXmlDoc.parseError.errorCode != 0)
			throw new TegException(ET_InvalidArg,oXmlDoc.parseError.reason);
				
		return oXmlDoc;
	}
	catch(e)
	{
		alert("LoadXmlFile("+sXmlPath+"), Failed to load Player essential config file, Error: " + e);
		return null;
	}
} // LoadXmlFile_IE

//-----------------------------------------------------------------------
function LoadXmlFile_FF_SF(sXmlPath)
{
	try
	{
		try
		{
			var oReq = new XMLHttpRequest();	 // readyState = 0. (The request is not initialized)
			oReq.open("GET", sXmlPath, false); // readyState = 1. (The request has been set up)
			oReq.send(null);									 // readyState = 4. (The request is complete)
		
			if(oReq.readyState != 4 || !(oReq.status == 200 || oReq.status == 0)) // Status 0 OK for local file system.
				throw new TegException(ET_InvalidArg,"Failed loading the specified URI.");
			
			return oReq.responseXML; 
		}
		catch(e)
		{
			if(BROWSER_TYPE == BT_SF || typeof netscape.security.PrivilegeManager.enablePrivilege != "function")
				throw e;
		}
		
		// Second trial for FireFox, this time with elevated privileges.
		// From FireFox version 3.0 and up, "back" relative paths need this security privilege as well.
		netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
			
		var oReq = new XMLHttpRequest();	 // readyState = 0. (The request is not initialized)
		oReq.open("GET", sXmlPath, false); // readyState = 1. (The request has been set up)
		oReq.send(null);									 // readyState = 4. (The request is complete)
		
		if(oReq.readyState != 4 || !(oReq.status == 200 || oReq.status == 0)) // Status 0 OK for local file system.
			throw new TegException(ET_InvalidArg,"Failed loading the specified URI."); 

		return oReq.responseXML;
	}
	catch(e)
	{
		alert("LoadXmlFile("+sXmlPath+"), Failed to load Player essential config file, Error: " + e.message);
		return null;
	}	
} // LoadXmlFile_FF_SF

//===========================================================================
//|													SelectSingleNode																|
//===========================================================================
//-----------------------------------------------------------------------
function SelectSingleNode_IE_FF(oXmlDoc,sXPath,bGetInnerText)
{
	try
	{
		// Set default value to true.
		bGetInnerText = typeof bGetInnerText == "boolean" ? bGetInnerText : true; 
				
		var result = oXmlDoc.selectSingleNode(sXPath);
		
		if((sXPath.indexOf('@') >= 0) && (result != null) && bGetInnerText) // Looking for an attribute.
			result = GetNodeInnerText(result);
		
		return result;
	}
	catch(e)
	{
		alert("SelectSingleNode("+sXPath+"), Failed to obtain Node's attribute, Error: " + e + ".");
		return null;
	}
} // SelectSingleNode_IE_FF

//-----------------------------------------------------------------------
function SelectSingleNode_SF(oXmlDoc,sXPath,bGetInnerText)
{
	try
	{
		// Set default value to true.
		bGetInnerText = typeof bGetInnerText == "boolean" ? bGetInnerText : true; 
		
		var result = null;
		var oCntx  = new ExprContext(oXmlDoc);
		var oExpr	 = xpathParse(sXPath);
		var e			 = oExpr.evaluate(oCntx);
		
		if((sXPath.indexOf('@') >= 0) && bGetInnerText)
		{		
			result = e.stringValue();
			
			if(result != "") 
				return result;
			
			// Second try with lower case. 
			oExpr	 = xpathParse(sXPath.toLowerCase());
			e			 = oExpr.evaluate(oCntx);
			result = e.stringValue();
			
			// The stringValue() will return an empty string even if there is no value at all.
			// Every Time that stringValue() returns an empty string we refer to it as if the attribute doesn't exist.
			if(result == "")
				result = null;
		}
		else
		{
			result = e.nodeSetValue()[0];
		}
		return result;
	}
	catch(e)
	{
		alert("SelectSingleNode("+sXPath+"), Failed to obtain Node's attribute, Error: " + e + ".");
		return null;
	}
} // SelectSingleNode_SF

//===========================================================================
//|															SelectNodes																	|
//===========================================================================
//-----------------------------------------------------------------------
function SelectNodes_IE_FF(oXmlDoc,sXPath)
{	
	try
	{
		return oXmlDoc.selectNodes(sXPath);
	}
	catch(e)
	{
		alert("SelectNodes("+sXPath+"), Failed to obtain Node list, Error: " + e + ".");
		return null;
	}
} // SelectNodes_IE_FF

//-----------------------------------------------------------------------
function SelectNodes_SF(oXmlDoc,sXPath)
{
	try
	{
		var oCntx = new ExprContext(oXmlDoc);
		var oExpr = xpathParse(sXPath);
		var e = oExpr.evaluate(oCntx);
		return e.nodeSetValue();
	}
	catch(e)
	{
		alert("SelectNodes("+sXPath+"), Failed to obtain Node list, Error: " + e + ".");
		return null;
	}
} // SelectNodes_SF

//===========================================================================
//|													GetNodeInnerText																|
//===========================================================================
//-----------------------------------------------------------------------
function GetNodeInnerText_IE(node)
{
	return node.text;
} // GetNodeInnerText_IE

//-----------------------------------------------------------------------
function GetNodeInnerText_FF(node)
{
	return node.textContent;
} // GetNodeInnerText_FF

//-----------------------------------------------------------------------
function GetNodeInnerText_SF(node)
{
	var result = xmlValue(node);
	result = result.replace(/[\n\r]/g,"");
	while (result.indexOf(' ') == 0){result = result.substr(1,result.length);}
	return result;
} // GetNodeInnerText_SF

//===========================================================================
//|													GetNodeInnerXml																	|
//===========================================================================
function GetNodeInnerXml_IE(node)
{
		return GetInnerXmlFromXmlString(node.xml);
} // GetNodeInnerXml_IE

//-----------------------------------------------------------------------
function GetNodeInnerXml_SF(node)
{
	return GetInnerXmlFromXmlString(xmlText(node));
} // GetNodeInnerXml_SF

//-----------------------------------------------------------------------
function GetNodeInnerXml_FF(node)
{
	if(typeof XMLSerializer != "undefined")
			sXml = (new XMLSerializer()).serializeToString(node);
	if(sXml != null) 
		return GetInnerXmlFromXmlString(sXml);
	else
		return null;
} // GetNodeInnerXml_FF

//-----------------------------------------------------------------------
function GetInnerXmlFromXmlString(sXml)
{
	var sResult = null;
	if((typeof sXml == "string") && (sXml != null))
	{
		var nBeginIndex = sXml.indexOf(">") +1;
		var nEndIndex = sXml.lastIndexOf("<");
		if(nEndIndex > nBeginIndex)
		{
			sResult = sXml.substring(nBeginIndex,nEndIndex);
			sResult = sResult.replace(/[\n\r]/g,"");
		}
	}
	return sResult;
} // GetInnerXmlFromXmlString

//===========================================================================
//|											FireFox functions definition												|
//===========================================================================
//-----------------------------------------------------------------------
function DefineSelectSingleNode_FF()
{
	// check for XPath implementation 
	if( document.implementation.hasFeature("XPath", "3.0") ) 
	{ 
		// prototying the XMLDocument 
		XMLDocument.prototype.selectSingleNode = function(sXPath, xNode) 
		{ 
			if(!xNode)
				xNode = this; 
			
			var oNSResolver = this.createNSResolver(this.documentElement);
			var aItems = this.evaluate(sXPath, xNode, oNSResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
			return (aItems == null) ? null : aItems.singleNodeValue;
		} 
		
		// Prototying the Element 
		Element.prototype.selectSingleNode = function(sXPath) 
		{	
			if(this.ownerDocument.selectSingleNode) 
				return this.ownerDocument.selectSingleNode(sXPath, this); 
			else
				throw new TegException(ET_InvalidArg,"Element::selectSingleNode is only for XML Elements");
		} 
	}		 
} // DefineSelectSingleNode_FF

//------------------------------------------------------------------------------------------------------------------------
function DefineSelectNodes_FF()
{
	// check for XPath implementation 
	if( document.implementation.hasFeature("XPath", "3.0") ) 
	{ 
		// prototying the XMLDocument 
		XMLDocument.prototype.selectNodes = function(sXPath, xNode) 
		{ 
			 if(!xNode)
				xNode = this;
				
			 var oNSResolver = this.createNSResolver(this.documentElement); 
			 var aItems			 = this.evaluate(sXPath, xNode, oNSResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
			 var aResult		 = [];
			 
			 for( var i=0; i<aItems.snapshotLength; i++)
					aResult[i] =  aItems.snapshotItem(i);
					
			 aResult.length= aItems.snapshotLength; // So it would resembe IE's XMLDOMNodeLis
			 return aResult;
		} 

		// Prototying the Element 
		Element.prototype.selectNodes = function(sXPath) 
		{ 
			if(this.ownerDocument.selectNodes) 
				return this.ownerDocument.selectNodes(sXPath, this);
			else
				throw new TegException(ET_InvalidArg,"Element::selectNodes is For XML Elements Only! XPATH=" +sXPath);
		} 
	}
} // DefineSelectNodes_FF

//------------------------------------------------------------------------------------------------------------------------
function DefineOuterHTML_FF()
{
	HTMLElement.prototype.__defineGetter__("outerHTML",
		function() 
		{
			var _emptyTags = 
			{
				"IMG":	 true,
				"BR":		 true,
				"INPUT": true,
				"META":	 true,
				"LINK":	 true,
				"PARAM": true,
				"HR":		 true
			};

			var attrs = this.attributes;
			var str = "<" + this.tagName;
			for(var i = 0; i < attrs.length; i++)
				str += " " + attrs[i].name + "=\"" + attrs[i].value + "\"";

			if(_emptyTags[this.tagName])
				return str + ">";

			return str + ">" + this.innerHTML + "</" + this.tagName + ">";
		});
} // DefineOuterHTML_FF