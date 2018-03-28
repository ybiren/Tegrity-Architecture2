/************************************************************\
|* FILE: Request.js																					*|
|* DESC: HTML query string parser.													*|
|*			 This Global Class will hold the CLA Array,	in order*|
|*				to access a spesific parameter, just call					*|
|*				Request.ClientVariables("ParamName").							*|
|*																													*|
|* AUTH: Harel Gruia																				*|
|* DATE: 16/02/2006																					*|
|*										Copyright Tegrity Ltd 2006						*|
\************************************************************/

//////////////////////////////////////////////////////////////////////////////////
//														class Request																			//
//														-------------																			//
// Use:																																					//
//																																							//
//////////////////////////////////////////////////////////////////////////////////

	////////////////////////////////////////////////////////////
	//			Constructors
	////////////////////////////////////////////////////////////
	function _Request()
	{
		// Call the actual Constructor.
		this.Init();
	} // Base
	
	////////////////////////////////////////////////////////////
	//													Methods
	////////////////////////////////////////////////////////////
	//-----------------------------------------------------------------------
	_Request.prototype.Init = function() 
	{
		// The Default Constructor.

		// Public Members.
		this.m_ArgList = new Array();
		this.m_QueryString = window.location.search;
	
		if(this.m_QueryString.charAt(0) == '?')
		{
			this.m_QueryString = this.m_QueryString.substring(1);
			var Args = this.m_QueryString.split("&");
		 
			for(var i=0; i<Args.length; i++) 
			{
				var ArgPair = Args[i].split("=");
				this.m_ArgList[ArgPair[0]] = ArgPair[1];
			}	
		}
	} // Request.prototype.Init
	
	//-----------------------------------------------------------------------
	_Request.prototype.toString = function() 
	{
		return "This page QueryString is - " + this.m_QueryString;
	} // Request.prototype.toString
	
	//-----------------------------------------------------------------------
	_Request.prototype.ClientVariables = function(ArgName) 
	{
		return this.m_ArgList[ArgName];
	} // Request.prototype.ClientVariables
	
	//-----------------------------------------------------------------------
	_Request.prototype.GetArgList = function() 
	{
		return this.m_ArgList;
	} // Request.prototype.GetArgList

	// The one and only instance.
	////////////////////////////////
	var Request = new _Request(); //
	////////////////////////////////
