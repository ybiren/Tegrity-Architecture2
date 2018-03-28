/************************************************************\
|* FILE: SessionXmlParser.js								                *|
|* DESC: Parses the session xml file.   					          *|
|*															                            *|
|* AUTH: Aviram Iny 										                    *|
|* DATE: 21/02/2006											                    *|
|*            				Copyright Tegrity Ltd 2006		        *|
\************************************************************/

//////////////////////////////////////////////////////////////////////////////////
//													class SessionXmlParser													    //
//													----------------------									            //
// Use:																												                  //
//																														                  //
//////////////////////////////////////////////////////////////////////////////////

	////////////////////////////////////////////////////////////
	//			Constructors
	////////////////////////////////////////////////////////////
	function SessionXmlParser(sSessionXmlPath)
	{
		// Call the actual Constructor.
		if ( arguments.length > 0 )
		    this.Init(sSessionXmlPath);
	} // SessionXmlParser
	
	////////////////////////////////////////////////////////////
	//            						Methods
	////////////////////////////////////////////////////////////
	
	//-----------------------------------------------------------------------
	
	SessionXmlParser.prototype.Init = function(sSessionXmlPath) 
	{
		this.sSessionXmlPath    = sSessionXmlPath;
		this.oSessionXml        = LoadXmlFile(sSessionXmlPath);
		this.sLayoutFolder      = null;
		this.sPlayerJSFilePath  = null;
		this.sWebSvcFilePath		= null;
		this.oProperties        = null;
		this.oTLSegments				= null;
		this.oControls          = null;
		this.sLastError					= null;
	} // SessionXmlParser.prototype.Init
	
	//-----------------------------------------------------------------------
	
	SessionXmlParser.prototype.toString = function() 
	{
		return this.sSessionXmlPath;
	} // SessionXmlParser.prototype.toString
	
	//-----------------------------------------------------------------------
	
	SessionXmlParser.prototype.GetPlayerJSFile = function() 
	{
	  if(this.sPlayerJSFilePath== null) 
	    this.sPlayerJSFilePath = SelectSingleNode(this.oSessionXml,"//SESSION/HEAD/PLAYER/@src");

	 	if(navigator.userAgent.indexOf("Firefox") != -1) //FF
		{
			//First we will check if path is relative
			if ( ! ((this.sPlayerJSFilePath.indexOf(":")<0) && (this.sPlayerJSFilePath.substring(0, 1) != "//")))
				if (this.sPlayerJSFilePath.indexOf("file") < 0) 
				{	
					//var sLayoutFolderTemp = 
					this.sPlayerJSFilePath = "file:///" + this.sPlayerJSFilePath;
				}
		}

	  return this.sPlayerJSFilePath;
	} // SessionXmlParser.prototype.GetPlayerJSFile
	
	//-----------------------------------------------------------------------
	
	SessionXmlParser.prototype.GetLayoutFolder = function() 
	{
	  if(this.sLayoutFolder == null) 
	    this.sLayoutFolder = SelectSingleNode(this.oSessionXml,"//SESSION/HEAD/LAYOUT/@src") + "/";
		
		if(navigator.userAgent.indexOf("Firefox") != -1) //FF
		{
			//First we will check if path is relative
			if ( ! ((this.sLayoutFolder.indexOf(":")<0) && (this.sLayoutFolder.substring(0, 1) != "//")))
				if (this.sLayoutFolder.indexOf("file") < 0) 
				{	
					//var sLayoutFolderTemp = 
					this.sLayoutFolder = "file:///" + this.sLayoutFolder;
				}
		}

		return this.sLayoutFolder;
	} // SessionXmlParser.prototype.GetLayoutFolder
	
	//-----------------------------------------------------------------------
	
	SessionXmlParser.prototype.GetWebServiceFile = function() 
	{
	  if(this.sWebSvcFilePath == null) 
	    this.sWebSvcFilePath = SelectSingleNode(this.oSessionXml,"//SESSION/HEAD/SERVER/@src");
		return this.sWebSvcFilePath;
	} // SessionXmlParser.prototype.GetLayoutFolder

	
	//-----------------------------------------------------------------------
	SessionXmlParser.prototype.GetProperties = function() 
	{
	  if (this.oProperties == null)
	  {
	    this.oProperties = new Object();
      var oXmlDomNodeList = SelectNodes(this.oSessionXml,"//SESSION/HEAD/PROPS/PROP");
      for (var i=0; i < oXmlDomNodeList.length; i++)
      {
        var name = SelectSingleNode(oXmlDomNodeList[i],"@name");
        var value = SelectSingleNode(oXmlDomNodeList[i],"@value");
        this.oProperties[name] = value;
      }  
    }
    return this.oProperties;
	} // SessionXmlParser.prototype.GetProperties
	
	//-----------------------------------------------------------------------
	SessionXmlParser.prototype.GetTLSegments = function()
	{
		if(this.oTLSegments == null)
	  {
	    this.oTLSegments = new Array();
      var nIndex,sType,nTimelineID,nTime,nDuration;
      var oXmlDomNodeList = SelectNodes(this.oSessionXml,"//SESSION/TMLN/SGMTS/SGMT");
      
      for(var i=0; i < oXmlDomNodeList.length; i++)
      {
        nIndex			= SelectSingleNode(oXmlDomNodeList[i],"@inx");
        sType				= SelectSingleNode(oXmlDomNodeList[i],"@type");
        nTimelineID = SelectSingleNode(oXmlDomNodeList[i],"@tmln-id");
        nTime				= SelectSingleNode(oXmlDomNodeList[i],"@time");
        nDuration		= SelectSingleNode(oXmlDomNodeList[i],"@dur");
        
        // Set defaults.
        if(!IsString(nTimelineID)) nTimelineID = "0";
        
        // Add to the Arrary.
        this.oTLSegments.push({nIndex: Number(nIndex), sType: sType, nTimelineID: Number(nTimelineID),  nTime: Number(nTime), nDuration: Number(nDuration)});
      }  
    }
    return this.oTLSegments;
	} // SessionXmlParser.GetTLSegments
	
	//-----------------------------------------------------------------------
  SessionXmlParser.prototype.GetControls = function() 
	{
	  if (this.oControls == null)
	  {
	    this.oControls = new Object();
      var oXmlDomNodeList = SelectNodes(this.oSessionXml,"//SESSION/DATA/CTRLS/CTRL");
      for (var i=0; i < oXmlDomNodeList.length; i++)
      {
     
        sControlId = SelectSingleNode(oXmlDomNodeList[i],"@id");
        this.oControls[sControlId] = new Array();
        var oXmlDomNodeLayerList = SelectNodes(oXmlDomNodeList[i],"LAYER");
        for (var j=0; j < oXmlDomNodeLayerList.length; j++)
        {
        
          oLayer = new Object(); 
          oLayer.zOrder		= SelectSingleNode(oXmlDomNodeLayerList[j],"@z-order");
          oLayer.streamId = SelectSingleNode(oXmlDomNodeLayerList[j],"@stream-id");
          oLayer.src			= SelectSingleNode(oXmlDomNodeLayerList[j],"@src");
          
          this.oControls[sControlId].push(oLayer);  
        }
        
      }  
    }
    return this.oControls;
	} // SessionXmlParser.prototype.GetControls
	
	//-----------------------------------------------------------------------
	SessionXmlParser.prototype.CacheFile = function()
	{
	  this.GetPlayerJSFile();
	  this.GetLayoutFolder();
	  this.GetPropertiesArr();
	  this.GetTLSegments();
	  this.GetControls();
	}
	
	//-----------------------------------------------------------------------
	SessionXmlParser.prototype.IsValid = function()
	{
		if (this.GetPlayerJSFile() == null || this.GetPlayerJSFile() == "")
		{
			this.sLastError = "No 'src' attribute in the '//SESSION/HEAD/PLAYER' node.";
			return false;
		}
		if (this.GetLayoutFolder() == null || this.GetLayoutFolder() == "")
		{
			this.sLastError = "No 'src' attribute in the '//SESSION/HEAD/LAYOUT' node.";
			return false;
		}
		if (this.GetProperties()["Duration"] == null || this.GetProperties()["Duration"] == "")
		{
			this.sLastError = "No 'Duration' property in the '//SESSION/HEAD/PROPS/PROP' node.";
			return false;
		}
		if (this.GetProperties()["SessionDateTime"] == null || this.GetProperties()["SessionDateTime"] == "")
		{
			this.sLastError = "No 'SessionDateTime' property in the '//SESSION/HEAD/PROPS/PROP' node.";
			return false;
		}
		if (this.GetProperties()["TimeZone"] == null || this.GetProperties()["TimeZone"] == "")
		{
			this.sLastError = "No 'TimeZone' property in the '//SESSION/HEAD/PROPS/PROP' node.";
			return false;
		}
		if (this.GetProperties()["SessionGUID"] == null || this.GetProperties()["SessionGUID"] == "")
		{
			this.sLastError = "No 'SessionGUID' property in the '//SESSION/HEAD/PROPS/PROP' node.";
			return false;
		}
		if (this.GetProperties()["CourseGUID"] == null || this.GetProperties()["CourseGUID"] == "")
		{
			this.sLastError = "No 'CourseGUID' property in the '//SESSION/HEAD/PROPS/PROP' node.";
			return false;
		}
		if (this.GetProperties()["InstructorGUID"] == null || this.GetProperties()["InstructorGUID"] == "")
		{
			this.sLastError = "No 'InstructorGUID' property in the '//SESSION/HEAD/PROPS/PROP' node.";
			return false;
		}
		return true;
	}
	
	//-----------------------------------------------------------------------
	SessionXmlParser.prototype.GetLastError = function() 
	{
		return this.sLastError;
	}
