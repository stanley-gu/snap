/*global define*/
define([
	'jquery',
	'underscore',
	'backbone',
	'models/panel',
	'models/ace',
	'views/ace',
	'views/panel',
	'views/biomodels',
	'views/sbml',
	'models/sbml',
	'models/biomodel',
	'models/simulation',
	'text!templates/biomodels.html',
	'collections/biomodels',
	'views/chart'
], function ($, _, Backbone, Panel, AceModel, AceView, PanelView, BiomodelsView, SbmlView, SbmlModel, Biomodel, SimResultsModel, ImportModelHtml, BiomodelsCollection, ChartView) {
	'use strict';

	var SnapView = Backbone.View.extend({

		initialize: function () {
			this.el = '#snap';
			this.$el = $(this.el);

			// Model
			this.$elLoadSbml = this.$el.children().find('div#loadSbml');
			this.loadSbmlView = new AceView({
				el: this.$elLoadSbml[0],
				model: new AceModel({
					theme: 'solarized_dark'
				})
			});
			this.loadSbmlPanel = new Panel({
				view: this.loadSbmlView,
				visible: true,
				span: 'span9'
			});
			this.loadSbmlPanelView = new PanelView({
				model: this.loadSbmlPanel
			});
			this.listenTo(this.loadSbmlView.model, 'change', 'saveModel');

			this.$elImportModel = this.$el.children().find('div#importModel');
			var template = _.template(ImportModelHtml);
			this.$elImportModel.append(template());
			var $elImportModel = this.$elImportModel;
			this.importModelPanel = new Panel({
				view: new Backbone.View({
					el: $elImportModel[0]
				}),
				span: 'span2'
			});
			this.importModelPanelView = new PanelView({
				model: this.importModelPanel
			});

			// BioModels
			//this.listenTo(BiomodelsCollection, 'add', this.addModel);
			this.biomodels = new BiomodelsCollection();
			this.listenTo(this.biomodels, 'sync', this.addModelView);

			// Simulation
			this.$elSim = this.$el.find('div#sim');
			this.simSettingsPanel = new Panel({
				view: new Backbone.View({
					el: this.$elSim[0]
				}),
				span: 'span8'
			});
			this.simSettingsPanelView = new PanelView({
				model: this.simSettingsPanel
			});

			// SBMLView
			this.$elSbmlView = this.$el.find('div#modelView');
			this.sbmlPanel = new Panel({
				view: new SbmlView({
					el: this.$elSbmlView[0],
					model: new SbmlModel()
				}),
				span: 'span8'
			});
			this.sbmlPanelView = new PanelView({
				model: this.sbmlPanel
			});

			// Chart
			this.$elChart = this.$el.children().find('div#chart_container');
			this.render();
		},
		events: {
			'click #loadSbml.btn' : 'toggleLoadSbml',
			'click #importModel.btn' : 'toggleImportModel',
			'click #searchBiomodels.btn' : 'getBiomodels',
			'click #simSettings.btn' : 'toggleSimSettings',
			'click #submitSim.btn' : 'runSimulation',
			'click #viewModel.btn' : 'toggleLayout',
			'click #autolayout.btn' : 'layoutModel'
		},
		toggleVisible: function (p) {
			if (p.get('visible')) {
				p.set('visible', false);
			} else {
				p.set('visible', true);
			}
		},
		toggleSimSettings: function () {
			this.toggleVisible(this.simSettingsPanel);
		},
		toggleLoadSbml: function () {
			this.toggleVisible(this.loadSbmlPanel);
		},
		toggleImportModel: function () {
			this.toggleVisible(this.importModelPanel);
		},
		toggleChart: function () {
			this.toggleVisible(this.chartPanel);
		},
		toggleLayout: function () {
			this.toggleVisible(this.sbmlPanel);
		},
		layoutModel: function () {
			//this.sbmlPanel.get('view').model.set('sbml', this.loadSbmlView.editor.getValue());
			this.sbmlPanel.get('view').model.save({'sbml': this.loadSbmlView.editor.getValue()});
			if (this.sbmlPanel.get('view').model.get('valid')) {
				this.sbmlPanel.get('view').render();
			}
		},
		saveModel: function () {
			console.log('calling saveModel');
			this.sbmlPanel.get('view').model.save({'sbml': this.loadSbmlView.editor.getValue()});
		},
		runSimulation: function () {
			//var sbml = this.loadSbmlView.editor.getValue(),
			this.saveModel();

			// adding parameter sliders
			if (this.parametersView === null) {
				this.parametersView = new ParametersView();
			}

			var sbml = this.sbmlPanel.get('view').model.get('sbml'),
				that = this;
			console.log(sbml);
			$.ajax({
				data: {
					sbml: sbml,
					sim: {
						simulator: this.$elSim.find('label.radio [name="simulatorRadio"]:checked').val(),
						time: this.$elSim.find('input#simTime').val(),
						steps: this.$elSim.find('input#simSteps').val()
					}
				},
				type: 'POST',
				//error: function (jqXHR, textStatus, errorThrown) {
				//	console.log('Model failed to be fetched from server: ' + textStatus + errorThrown);
				//},
				processData: true,
				url: 'simulator',
				success: function (data, textStatus, jqXHR) {
					console.log('simulated model!');
					var model = new SimResultsModel({simulator: 'libSbmlSim', rawData: data});
					that.$elChart.find('div').empty();
					that.chartView = new ChartView({el: that.$elChart[0], model: model});
					that.chartPanel = new Panel({
						view: that.chartView,
						span: 'span9',
						visible: true
					});
					that.chartPanelView = new PanelView({
						model: that.chartPanel
					});
				}
			});
		},
					   // gets new biomodel attributes
		newAttributes: function (id, view) {
			return {
				id: id,
				editorView: view
			};
		},
		   // generates a list of all biomodels that match search criteria and
		   // then adds all the models to the collection
		getBiomodels: function () {
						  // searching by model ID
			var mId = this.$elImportModel.children().find('input#modelId')[0].value;

			//this.biomodels.create(this.newAttributes(mId, this.loadSbmlView));
			//this.biomodels.add(new Biomodel({id: mId, editorView: this.loadSbmlView}));

			this.biomodel = new Biomodel({id: mId, editorView: this.loadSbmlView});
			this.biomodelView = new BiomodelsView({model: this.biomodel});
			this.listenTo(this.biomodel, 'change:sbml', this.addBiomodelView);
			// searching by ChEBI ID
			var chebi = this.$elImportModel.children().find('input#chebi')[0].value;
			//$.ajax({
			//	data: {
			//		chebi: chebi
			//	},
			//	type: 'GET',
			//	//error: function (jqXHR, textStatus, errorThrown) {
			//	//	console.log('Model failed to be fetched from server: ' + textStatus + errorThrown);
			//	//},
			//	dataType: 'json',
			//	url: 'chebi',
			//	success: function (data, textStatus, jqXHR) {
			//		console.log(JSON.parse(data));
			//	},
			//	error: function (jqXHR, textStatus, errorThrown) {
			//		console.log(textStatus);
			//	}
			//});
		},
		// adds a single biomodel to the collection and creates the view
		addModel: function (biomodel) {
			var view = new BiomodelsView({model: biomodel});
		},
		addModelView: function (biomodel) {
			var view = new BiomodelsView({model: biomodel});
			this.$elImportModel.append(view.$el);
		},
		addBiomodelView: function () {
			this.$elImportModel.append(this.biomodelView.$el);
		},
		render: function () {
		}
	});
	return SnapView;
});
