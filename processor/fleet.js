'use strict';

var vehicle_group = require('./vehicle_group');
var _ = require("lodash");
var car_types = ["klein", "mittel", "groß", "LNF1", "LNF2"];
var energy_types = ["benzin", "diesel", "hybrid-benzin", "hybrid-diesel", "BEV"];
var energy_types_electro = ["hybrid-benzin", "hybrid-diesel", "BEV"]
var charging_options = ["Keine","Wallbox 3,7kW","Wallbox 22kW","Ladesäule 22kW","Ladesäule 43kW","Ladesäule 50kW DC"];
var year_min = 2017;
var year_max = 2050;
// Special groups energy type
const SG_ENERGY_TYPES = ['long_distance_train', 'short_distance_train',
                         'rental_bev',  'rental_gas', 'bike',
                         'plane', 'businessplane', 'savings'];

var Fleet = function(params) {
	this.fleet_presets = {}
	this.fleet_presets.fleet_size = 0
	this.fleet_presets.fleet_size_electro = 0
	this.fleet_presets.groups_electro = 0

	// Calculates the number of vehicles
	params.groups.forEach(function(group, i) {
		// For better compatibility with Mongoose nested object
		if( group.hasOwnProperty("toObject") ) {
			group = params.groups[i] = group.toObject();
		}
		if( SG_ENERGY_TYPES.indexOf(group.vars.energy_type) == -1 ) {
			this.fleet_presets.fleet_size += group.vars.num_of_vehicles
			if (energy_types_electro.indexOf(group.vars.energy_type) > -1) {
				this.fleet_presets.groups_electro += 1
				this.fleet_presets.fleet_size_electro += group.vars.num_of_vehicles
			}
		}
	}, this);
	
	// Financial variables
	this.fleet_presets.inflationsrate   = 1.5		// That's 1.5% per year
	this.fleet_presets.exchange_rate    = 1.25 		// How many $ for 1 €
	this.fleet_presets.discount_rate    = 5	        // 5% per year
	this.fleet_presets.abschreibungszeitraum = 6  	// amortization period
	this.fleet_presets.unternehmenssteuersatz = 30 	// corporate tax
	this.fleet_presets.sonder_afa = false			// special accounting rule to increase amortization for electro vehicles in the first year deactivated by default

	// Energy prices in € per Liter and cents per kWh
	this.energy_known_prices = {
		"diesel": {
			"2014": 1.1349,
			"2015": 0.9841,
			"2016": 1.0084,
			"2017": 1.0084
		},
		"benzin": {
			"2014": 1.2843,
			"2015": 1.1711,
			"2016": 1.1765,
			"2017": 1.1765
		},
		"BEV": {
			"2014": .2449,
			"2015": .2410,
			"2016": .2101,
			"2017": .2101
		}
	}

	// Evolution of energy prices
	this.energy_prices_evolution = {
		"hydrocarbon": [
			{
				"start_year": 2016,
				"end_year": 2050,
				"rate": .02
			}
		],
		"strom": [
			{
				"start_year": 2017,
				"end_year": 2020,
				"rate": .013
			},
			{
				"start_year": 2021,
				"end_year": 2035,
				"rate": -.003
			},
			{
				"start_year": 2036,
				"end_year": 2050,
				"rate": -.003
			},
		]
	}

	// Vehicle acquisition price
	this.fleet_presets.raw_acquisition_price = {}
	this.fleet_presets.nettolistenpreise = {
		"benzin":{
			"klein":{"2016": 11549},
			"mittel":{"2016": 19557},
			"groß":{"2016": 30047}
		},
		"diesel": {
			"LNF1":{"2016": 20376},
			"LNF2":{"2016": 34120}
		}
	}

	// Increase in acquisition prices
	this.fleet_presets.kostensteigerung20102030 = {
		"benzin":{
			"klein": 0.1376997017,
			"mittel": 0.06650397417,
			"groß": 0.0365742888
		},
		"diesel":{
			"klein": 0.08550544026,
			"mittel": 0.03211188878158,
			"groß": 0.02215547961983,
			"LNF1": .01,
			"LNF2": .01
		}
	}

	// Surcharge for the price of vehicle compared to benzin in EUR
	this.fleet_presets.aufpreis = {
		"diesel":{
			"klein": 3912,
			"mittel": 1738,
			"groß": 4561,
			"LNF1": 0,
			"LNF2": 0
		},
		"hybrid-benzin": {
			"mittel": 5728,
			"groß": 4917
		},
		"hybrid-diesel": {
			"groß": 15078
		},
		"BEV":{
			"klein":{"2016": 4096},
			"mittel":{"2016": 4333},
			"groß":{"2016": 21753},
			"LNF1":{"2016": 6000},
			"LNF2":{"2016": 20000}
		}
	}

	// Variables for the battery
	this.fleet_presets.battery_price_per_KWh = {}
	this.fleet_presets.entladetiefe = 0.8
	this.fleet_presets.reichweite = 150 			// km
	this.fleet_presets.batteriepreise = {			// in € per kWh
		"2014": 400.0,
		"2015": 380.0,
		"2016": 200.0,
		"2017": 190.0,
		"2018": 170.0,
		"2019": 155.0,
		"2020": 145.0,
		"2021": 135.0,
		"2022": 125.0,
		"2023": 120.0,
		"2024": 115.0,
		"2025": 110.0
	}

	this.fleet_presets.battery_capacity = {
		"BEV" : {
			"klein": 20,
			"mittel": 30,
			"groß": 70,
			"LNF1": 35,
			"LNF2": 50
		},
		"hybrid-benzin": {
			"mittel": 6,
			"groß": 8
		},
		"hybrid-diesel": {
			"groß": 12
		}
	}

	// Charging options costs in EUR
	this.fleet_presets.charging_option = "Keine"
	this.fleet_presets.charging_option2 = "Keine"
	this.fleet_presets.charging_option_maintenance_costs = 0
	this.fleet_presets.charging_option2_maintenance_costs = 0
	this.fleet_presets.energy_source = "strom_mix"
	this.fleet_presets.charging_option_cost = 0
	this.fleet_presets.charging_option_num = 0
	this.fleet_presets.charging_option2_num = 0
	this.fleet_presets.charging_options = {
		"Keine": { "acquisition": 0, "maintenance": 0},
		"Wallbox 3,7kW": { "acquisition": 850, "maintenance": 0},
		"Wallbox 22kW": { "acquisition": 1300, "maintenance": 0},
		"Ladesäule 22kW": { "acquisition": 3500, "maintenance": 280},
		"Ladesäule 43kW": { "acquisition": 4000, "maintenance": 280},
		"Ladesäule 50kW DC": {"acquisition": 28000, "maintenance": 1700}
	}

	// Variables for evolution of energy consumption in % of reduction per decade
	this.fleet_presets.verbrauchsentwicklung = {
		"benzin":  {"2017": -.3,  "2020": -.12},
		"diesel":  {"2017": -.26, "2020": -.1},
		"LNF":     {"2017": -.14, "2020": -.1},
		"BEV":     {"2017": -.15, "2020": -.01},
		"hybrid-benzin":  {"2017": 0, 	  "2020": 0},
		"hybrid-diesel":  {"2017": 0, 	  "2020": 0},
		"BEV-LNF": {"2017": 0,    "2020": -.01}
	}

	// Size of the engine (for oil consumption)
	this.fleet_presets.price_of_lubricant = 8 // € per Liter
	this.fleet_presets.hubraum = {
		"benzin": {"klein": 1137, "mittel": 1375,"groß": 1780},
		"diesel": {"klein": 1383, "mittel": 1618,"groß": 1929, "LNF1": 1722, "LNF2": 2140}
	}

	// Consumption in liters 
	this.fleet_presets.verbrauch = {
		"benzin": {"klein": 6.48, "mittel": 7.576,"groß": 8.777},
		"diesel": {"klein": 5.159, "mittel": 5.767,"groß": 6.623, "LNF1": 7.67, "LNF2": 8.95},
		"hybrid-benzin": {"mittel": 6.574, "groß": 7.7},
		"hybrid-diesel": {"groß": 7.762}
		}
	// Consumption in kWh/km
	this.fleet_presets.electro_verbrauch = {
		"BEV":    {"klein": 0.133, "mittel": 0.15,"groß": .2, "LNF1": .175, "LNF2": .25},
		"hybrid-diesel": {"groß": 0.21},
		"hybrid-benzin": {"mittel": 0.1550 , "groß": 0.19}
	}

	// Hybrid lubricant consumption discount
	this.fleet_presets.hybrid_minderverbrauch_schmierstoff = .2

	//Number of days in the year when the vehicle is in use
	this.fleet_presets.einsatztage_pro_jahr = 250

	// Insurance in €/year
	this.fleet_presets.versicherung = {
		"benzin": {"klein": 617, "mittel": 665,"groß": 689},
		"diesel": {"klein": 694, "mittel": 686,"groß": 753, "LNF1": 700, "LNF2": 870},
		"BEV":    {"klein": 613, "mittel": 693,"groß": 784, "LNF1": 700, "LNF2": 870}
					}

	// Yearly tax in €
	this.fleet_presets.kfzsteuer = {
		"benzin": {"klein": 45.88, "mittel": 79.24,"groß": 107.48},
		"diesel": {"klein": 126.26, "mittel": 152.73,"groß": 210.59, "LNF1": 173.63, "LNF2": 260.59},
		"hybrid-benzin": {"klein": 23, "mittel": 24.09,"groß": 37.65},
		"hybrid-diesel": {"klein": 37, "mittel": 68,"groß": 215.55},
		"BEV":    {"klein": 0, "mittel": 0,"groß": 0, "LNF1": 0, "LNF2": 0}
					}

	// Yearly check up in €
	this.fleet_presets.untersuchung = {
		"benzin": {"HU": 23.74, "AU": 19.16},
		"diesel": {"HU": 23.74, "AU": 19.16},
		"BEV":    {"HU": 23.74, "AU": 0}
					}

	// Variables for repairs
	this.fleet_presets.faktor_BEV = 0.5 	// Discount for repairs of electro vehicles
	this.fleet_presets.faktor_HEV = 0.96 	// Discount for repairs of hybrid vehicles
	this.fleet_presets.traffic_multiplicator = {
		"normaler Verkehr" : 1,
		"schwerer Verkehr" : 1.2,
		"sehr schwerer Verkehr" : 2
	}

	this.fleet_presets.reperaturkosten = {
		"benzin": {
			"klein": {
				"inspektion": 193,
				"reparatur": 139,
				"reifen": 124,
				"sonstige": 0
			},
			"mittel": {
				"inspektion": 214,
				"reparatur": 170,
				"reifen": 194,
				"sonstige": 0
			},
			"groß": {
				"inspektion": 229,
				"reparatur": 183,
				"reifen": 260,
				"sonstige": 0
			}
		},
		"diesel": {
			"klein": {
				"inspektion": 198,
				"reparatur": 199,
				"reifen": 192,
				"sonstige": 0
			},
			"mittel": {
				"inspektion": 197,
				"reparatur": 217,
				"reifen": 246,
				"sonstige": 0
			},
			"groß": {
				"inspektion": 238,
				"reparatur": 207,
				"reifen": 338,
				"sonstige": 0
			},
			"LNF1": {
				"inspektion": 232,
				"reparatur": 210,
				"reifen": 182,
				"sonstige": 0
			},
			"LNF2": {
				"inspektion": 252,
				"reparatur": 280,
				"reifen": 262,
				"sonstige": 0
			}
		}
	}

	// CO2 emission variables in g per L or kg per kWh
	this.fleet_presets.CO2_from_electricity_mix = {}
	this.fleet_presets.co2_emissions = {
		"strom_mix": {
			"2017": .519,
			"2018": .508,
			"2019": .496,
			"2020": .485,
			"2021": .483,
			"2022": .482,
			"2023": .480,
			"2024": .479,
			"2025": .477,
			"2026": .464,
			"2027": .452,
			"2028": .439,
			"2029": .426,
			"2030": .413
		},
		"strom_erneubar": 0.012,
		"benzin": 2650,
		"diesel": 3010
	}

	// CO2 produced when the vehicle is produced
	this.fleet_presets.CO2_from_manufacturing = {
		"benzin": {"klein": 4605, "mittel": 5880,"groß": 6782},
		"diesel": {"klein": 5098, "mittel": 5880,"groß": 7094, "LNF1": 7000, "LNF2": 9500},
		"hybrid-benzin": {"mittel": 8400,"groß": 10711},
		"hybrid-diesel": {"groß": 11648},
		"BEV":    {"klein": 7851, "mittel": 9341,"groß": 13376, "LNF1": 13376, "LNF2": 18058}
	};

	// Add special groups
	SG_ENERGY_TYPES.forEach(function(group) {
		this.fleet_presets.CO2_from_manufacturing[group] = {"single_size": 0};
	}, this);

	// Calculation of the residual values
	this.fleet_presets.restwert_constants = {
		"a": 0.97948,
		"b1": -0.01437,
		"b2": -0.000117,
		"b3": 0.91569
	}

	this.setEnergyPrices = function() {
		var energy_types = [{"name": "diesel", "source": "hydrocarbon"}, {"name": "benzin", "source": "hydrocarbon"}, {"name": "BEV", "source": "strom"}]
		var estimates = {}

		this.fleet_presets.evolution_elec_price_until_2020 = this.energy_prices_evolution["strom"][0]["rate"] * 100.0
		this.fleet_presets.evolution_elec_price_until_2030 = this.energy_prices_evolution["strom"][1]["rate"] * 100.0
		this.fleet_presets.evolution_elec_price_until_2050 = this.energy_prices_evolution["strom"][2]["rate"] * 100.0
		this.fleet_presets.evolution_hydrocarbon_price_until_2050 = this.energy_prices_evolution["hydrocarbon"][0]["rate"] * 100.0

		if (params.vars.hasOwnProperty("evolution_hydrocarbon_price_until_2050")) {
			this.fleet_presets.evolution_hydrocarbon_price_until_2050 = params.vars["evolution_hydrocarbon_price_until_2050"]
			this.energy_prices_evolution["hydrocarbon"][0]["rate"] = params.vars["evolution_hydrocarbon_price_until_2050"] / 100
		}

		if (params.vars.hasOwnProperty("evolution_elec_price_until_2020")) {
			this.fleet_presets.evolution_elec_price_until_2020 = params.vars["evolution_elec_price_until_2020"]
			this.energy_prices_evolution["strom"][0]["rate"] = params.vars["evolution_elec_price_until_2020"] / 100
		}

		if (params.vars.hasOwnProperty("elec_price_2017")) {
			this.energy_known_prices["BEV"]["2017"] = params.vars["elec_price_2017"]
		}
		if (params.vars.hasOwnProperty("benzin_price_2017")) {
			this.energy_known_prices["benzin"]["2017"] = params.vars["benzin_price_2017"]
		}
		if (params.vars.hasOwnProperty("diesel_price_2017")) {
			this.energy_known_prices["diesel"]["2017"] = params.vars["diesel_price_2017"]
		}

		for (var i in energy_types) {
			var energy_type = energy_types[i]["name"]
			var energy_source = energy_types[i]["source"]
			estimates[energy_type] = {}

			for (var year = 2017; year <= 2050; year++) {

				estimates[energy_type][year] = {}

				// Checks if the value exists for the given year
				if (this.energy_known_prices[energy_type].hasOwnProperty(year)) {
					estimates[energy_type][year]["mittel"] = this.energy_known_prices[energy_type][year]
				} else {
					// Computes the estimate by finding the growth rate to use
					var evolution_rate = 0
					for (var j in this.energy_prices_evolution[energy_source]) {
						if (this.energy_prices_evolution[energy_source][j]["start_year"] <= year && this.energy_prices_evolution[energy_source][j]["end_year"] >= year){
							evolution_rate = this.energy_prices_evolution[energy_source][j]["rate"]
						}
					}
					// Applies the growth rate to get the price for the current year
					estimates[energy_type][year]["mittel"] = estimates[energy_type][year - 1]["mittel"] * (1 + evolution_rate)
				}
			}
		}

		this.fleet_presets.energy_prices = estimates
		if (!(params.vars.hasOwnProperty("elec_price_2017"))) {
			this.fleet_presets.elec_price_2017 = this.fleet_presets.energy_prices["BEV"][2017]["mittel"]
		} else {
			this.fleet_presets.elec_price_2017 = params.vars["elec_price_2017"]
		}
		if (!(params.vars.hasOwnProperty("benzin_price_2017"))) {
			this.fleet_presets.benzin_price_2017 = this.fleet_presets.energy_prices["benzin"][2017]["mittel"]
		} else {
			this.fleet_presets.benzin_price_2017 = params.vars["benzin_price_2017"]
		}
		if (!(params.vars.hasOwnProperty("diesel_price_2017"))) {
			this.fleet_presets.diesel_price_2017 = this.fleet_presets.energy_prices["diesel"][2017]["mittel"]
		} else {
			this.fleet_presets.diesel_price_2017 = params.vars["diesel_price_2017"]
		}
		this.fleet_presets.diesel_price_2017 = this.fleet_presets.energy_prices["diesel"][2017]["mittel"]
		this.fleet_presets.benzin_price_2017 = this.fleet_presets.energy_prices["benzin"][2017]["mittel"]

	}

	// Corrects amounts for inflation
	this.getCurrentPrice = function(amount, originalYear, wishedYear, inflation, rounded){
		if (inflation == undefined) { inflation = this.fleet_presets.inflationsrate }

		if (rounded == true) {
			return Math.round(amount * Math.pow(1+inflation, wishedYear - originalYear))
		} else {
			return amount * Math.pow(1+inflation, wishedYear - originalYear)
		}
	}

	// Returns the basis price for all vehicles
	this.setRawAcquisitionPrice = function(energy_type, car_type, year) {
		// Updates the starting prices with diesel
		var starting_price = this.fleet_presets.nettolistenpreise;
		if (energy_type != "BEV" && energy_type.indexOf("hybrid") == -1) {
			for (var type in starting_price["benzin"]) {
				if (energy_type != "benzin") {starting_price[energy_type][type] = {};}
				starting_price[energy_type][type]["2016"] = starting_price["benzin"][type]["2016"] + this.getPriceSurcharge(energy_type, type, year);
			}
			// Computes yearly price increase
			var yearly_increase = Math.pow((1 + this.fleet_presets.kostensteigerung20102030[energy_type][car_type]), (1/20)) - 1;
			// Computes the value for the asked year
			this.fleet_presets.raw_acquisition_price[energy_type][car_type][year] = starting_price[energy_type][car_type]["2016"] * Math.pow(1+yearly_increase, year - 2016)

		} else if (energy_type.indexOf("hybrid") > -1) { // hybrid car
			if (energy_type.indexOf("diesel") > -1) { //hybrid-diesel
				this.fleet_presets.raw_acquisition_price[energy_type][car_type][year] = this.fleet_presets.raw_acquisition_price["diesel"][car_type][year] + this.getPriceSurcharge("hybrid-diesel", car_type, year) + this.getPriceSurcharge("BEV", car_type, year);
			} else {
				this.fleet_presets.raw_acquisition_price[energy_type][car_type][year] = this.fleet_presets.raw_acquisition_price["benzin"][car_type][year] + this.getPriceSurcharge("hybrid-benzin", car_type, year) + this.getPriceSurcharge("BEV", car_type, year);
			}
		} else { // Elektro car
			if (car_type.indexOf("LNF") > -1) {
				this.fleet_presets.raw_acquisition_price[energy_type][car_type][year] = this.fleet_presets.raw_acquisition_price["diesel"][car_type][year] - this.getPriceSurcharge("diesel", "groß", year) + this.getPriceSurcharge(energy_type, car_type, year);
			} else {
				this.fleet_presets.raw_acquisition_price[energy_type][car_type][year] = this.fleet_presets.raw_acquisition_price["benzin"][car_type][year] + this.getPriceSurcharge(energy_type, car_type, year)
			}
		}
	}

	// Returns the surcharge one has to pay for an electro vehicle in a given year (excl. battery)
	this.getPriceSurcharge = function(energy_type, car_type, year) {
		if (energy_type == "benzin") { return 0 }
		else if (energy_type == "diesel") {
			return this.fleet_presets.aufpreis[energy_type][car_type]
		} else if (energy_type == "BEV") {
			var surcharge = this.fleet_presets.aufpreis["BEV"];
			var surcharge_decrease_2020 = -.5;
			var yearly_surcharge_deacrease = Math.pow((1 + surcharge_decrease_2020), (1/6)) - 1;
			for (var i = 2017; i<=2020; i++){ // Automates the fill out of surcharge
				for (var type in surcharge) {
					surcharge[type][i] = surcharge[type][i - 1] * (1 + yearly_surcharge_deacrease);
				}
			}
			for (var i = 2021; i<=2049; i++){ // Automates the fill out of surcharge
				for (var type in surcharge) {
					surcharge[type][i] = surcharge[type]["2020"];
				}
			}
			return surcharge[car_type][year]
		} else {
			if (this.fleet_presets.aufpreis[energy_type] === undefined){
				// Needed to prevent error on older fleets
				return this.fleet_presets.aufpreis["hybrid"][car_type]
			}
			return this.fleet_presets.aufpreis[energy_type][car_type]
		}
	}

	this.setChargingOptionPrice = function() {		

		// Hack: Goes through all default values for charging devices. If the params.var (user defined) value
		// Is in the list, it's ignored
		var default_prices_charging_options = []
		for (var i=0 ; i< charging_options.length; i++) {
			var default_price = this.fleet_presets.charging_options[charging_options[i]]["acquisition"]
			default_prices_charging_options.push(default_price)
		}

		// The user-input price has to exist, to be positive AND not to be in the list of default prices 
		if (params.vars.hasOwnProperty("charging_option_unitary_cost") && params.vars["charging_option_unitary_cost"] > 0 && default_prices_charging_options.indexOf(params.vars["charging_option_unitary_cost"]) == -1) {
			this.fleet_presets.charging_option_unitary_cost = params.vars["charging_option_unitary_cost"];
		} else {
			this.fleet_presets.charging_option_unitary_cost = this.fleet_presets.charging_options[this.fleet_presets.charging_option]["acquisition"];
		}
		if (params.vars.hasOwnProperty("charging_option2_unitary_cost") && params.vars["charging_option2_unitary_cost"] > 0 && default_prices_charging_options.indexOf(params.vars["charging_option2_unitary_cost"]) == -1) {
			this.fleet_presets.charging_option2_unitary_cost = params.vars["charging_option2_unitary_cost"];
		} else {
			this.fleet_presets.charging_option2_unitary_cost = this.fleet_presets.charging_options[this.fleet_presets.charging_option2]["acquisition"];
		}

		// To avoid nonsensical presentation to user, charging_option_num = 0 if "keine", 1 if not keine and not specified
		if (this.fleet_presets.charging_option == "Keine") {
			this.fleet_presets.charging_option_num = 0
			this.fleet_presets.charging_option_unitary_cost = 0
			params.vars["charging_option_unitary_cost"] = 0
			this.fleet_presets.charging_option_maintenance_costs = 0
		} else if (this.fleet_presets.charging_option_num == 0) {
			this.fleet_presets.charging_option_num = 1
		}
		if (this.fleet_presets.charging_option2 == "Keine") {
			this.fleet_presets.charging_option2_num = 0
			this.fleet_presets.charging_option2_unitary_cost = 0
			this.fleet_presets.charging_option2_maintenance_costs = 0
		} else if (this.fleet_presets.charging_option2_num == 0) {
			this.fleet_presets.charging_option2_num = 1
		}

	}

	this.setChargingOptionMaintenance = function() {

		// Same hack as above for acquisition costs
		var default_maintenance_charging_options = []
		for (var i=0 ; i< charging_options.length; i++) {
			var default_price = this.fleet_presets.charging_options[charging_options[i]]["maintenance"]
			default_maintenance_charging_options.push(default_price)
		}

		this.fleet_presets.charging_option_maintenance_costs = this.fleet_presets.charging_options[this.fleet_presets.charging_option]["maintenance"];
		this.fleet_presets.charging_option2_maintenance_costs = this.fleet_presets.charging_options[this.fleet_presets.charging_option2]["maintenance"];
		if (params.vars.hasOwnProperty("charging_option_maintenance_costs")) {
			if (params.vars["charging_option_maintenance_costs"] > 0  && default_maintenance_charging_options.indexOf(params.vars["charging_option_maintenance_costs"]) == -1){
				this.fleet_presets.charging_option_maintenance_costs = params.vars["charging_option_maintenance_costs"]
			}
		}
		if (params.vars.hasOwnProperty("charging_option2_maintenance_costs")) {
			if (params.vars["charging_option2_maintenance_costs"] > 0 && default_maintenance_charging_options.indexOf(params.vars["charging_option2_maintenance_costs"]) == -1){
				this.fleet_presets.charging_option2_maintenance_costs = params.vars["charging_option2_maintenance_costs"]
			}
		}

	}

	// Returns the price of the battery in E/kwh
	this.setBatteryPricePerKWh = function(year) {
		for (var i = 2021; i<=2025; i++) {
			this.fleet_presets.batteriepreise[i] = this.fleet_presets.batteriepreise[i-1] - 5
		}

		this.fleet_presets.battery_price_per_KWh[year] = this.fleet_presets.batteriepreise[year]
	}

	// Returns the estimated kg of CO2 per kWh based on the data points we have
	this.setCO2FromElectricityMix = function() {
		var estimates = {}
		for (var year in this.fleet_presets.co2_emissions["strom_mix"]){
			estimates[year] = this.fleet_presets.co2_emissions["strom_mix"][year]
		}

		this.fleet_presets.CO2_from_electricity_mix = estimates

	}

	// Updates the variables in case the Fleet receives user-input variables
	// The list of charging options and number of elec vehicles cannot be modified
	for(var prop in params.vars) {
    if( params.vars.hasOwnProperty(prop) && this.fleet_presets.hasOwnProperty(prop) && prop != "charging_options" && prop != "fleet_size" && prop != "groups_electro" && prop != "fleet_size_electro" ) {
			this.fleet_presets[prop] = params.vars[prop]
		}
	}

	// Removes the charging option if not in the list (otherwise: Error 500 happens)
	if( charging_options.indexOf(this.fleet_presets.charging_option) == -1 ) {
		this.fleet_presets.charging_option = "Keine"
	}

	//Sends fleet_presents to vars
	this.vars = this.fleet_presets

	// Initializes the object that will hold every aquisition prices
	for (var i in energy_types) {
		this.fleet_presets.raw_acquisition_price[energy_types[i]] = {}
		for (var j in car_types) {
			// Makes sure that we don't compute a forbidden combination, like benzin and LNF1
			if (!((car_types[j] == "LNF1" || car_types[j] == "LNF2") && (energy_types[i] == "benzin" || energy_types[i] == "hybrid-diesel" || energy_types[i] == "hybrid-benzin"))){
				this.fleet_presets.raw_acquisition_price[energy_types[i]][car_types[j]] = {}
				for (k = year_min; k< year_max; k++) {
					this.setRawAcquisitionPrice(energy_types[i],car_types[j],k)
				}
			}
		}
	}

	// Initializes the battery prices
	for (var k = year_min; k< year_max; k++) {
		this.setBatteryPricePerKWh(k)
	}

	// Initializes the prices of all charging options for all years
	this.setChargingOptionMaintenance()
	this.setChargingOptionPrice()

	// Initializes the CO2 from the electricity mix
	this.setCO2FromElectricityMix()

	// Initializes the energy prices
	this.setEnergyPrices()

	// Initializes the object that will contain the groups
	this.groups = new Array(params.groups.length);
	// Computes the TCO values for each vehicle group
	params.groups.forEach(function(group, group_id) {
		// In case forgotten
		if(group.vars.num_of_vehicles == undefined) {
			group.vars.num_of_vehicles = group.vars.num_of_vehicles || 1;
		}
		// For special groups
		if( SG_ENERGY_TYPES.indexOf(group.vars.energy_type) > -1 ) {
			group.vars.car_type = "single_size";
			group.vars.mileage = group.vars.mileage_special
			// In case no mileage is defined
			if(group.vars.mileage == undefined) {
				group.vars.mileage = group.vars.mileage || 0;
			}
		}

		var num_of_vehicles = group.vars.num_of_vehicles;
		// Copy just some values
		this.groups[group_id] = _.pick(group, ['_id', 'vars', 'name', 'special']);
		// Creates the corresponding vehicle group
		var current_group = this.groups[group_id]["insights"] = new vehicle_group.VehicleGroup(this.fleet_presets, group.vars);
		// CO2 from manufacturing, updates kg to grams 
		var current_CO2_from_manufacturing = this.fleet_presets.CO2_from_manufacturing[group.vars.energy_type][group.vars.car_type] * 1000;
		current_CO2_from_manufacturing *= current_group.holding_time * current_group.mileage / 180000

		this.groups[group_id]["insights"].num_of_vehicles = num_of_vehicles;
		this.groups[group_id]["insights"].TCO = {
			"CO2_from_driving": current_group.CO2 * num_of_vehicles,
			"CO2_from_manufacturing": current_CO2_from_manufacturing * num_of_vehicles,
			"CO2": (current_group.CO2 + current_CO2_from_manufacturing) * num_of_vehicles,
			"mileage": current_group.mileage * num_of_vehicles,
			"car_type": current_group.car_type,
			"energy_type": current_group.energy_type,
			// From TCO_simplified
			"net_acquisition_cost": current_group.TCO_simplified.net_cost * num_of_vehicles,
			"fixed_costs": current_group.TCO_simplified.fixed_costs * num_of_vehicles,
			"variable_costs": current_group.TCO_simplified.variable_costs * num_of_vehicles,
			"energy_costs": current_group.TCO_simplified.energy_costs * num_of_vehicles,
			"charging_infrastructure": current_group.TCO_simplified.charging_infrastructure * num_of_vehicles,
			"total_costs": (current_group.TCO_simplified.net_cost + current_group.TCO_simplified.fixed_costs + current_group.TCO_simplified.variable_costs + current_group.TCO_simplified.energy_costs + current_group.TCO_simplified.charging_infrastructure) * num_of_vehicles
		}
	}, this);

	// Initializes the TCO values for the whole fleet
	this.TCO = {
		"mileage": 0,
		"mileage_fleet": 0,
		"mileage_with_savings": 0,
		"mileage_overall": 0,
		"CO2": 0,
		"total_costs": 0,
		"fleet_num_of_vehicles": 0,
		"CO2_per_km": {
			"CO2_from_driving": 0,
			"CO2_from_manufacturing": 0
		},
		"cost_per_km": 0,
		"cost_by_group": {},
		"CO2_by_group": {},
		"cost_by_position": {
			"net_acquisition_cost": 0, 
			"charging_infrastructure":0,
			"energy_costs": 0, 
			"fixed_costs": 0, 
			"variable_costs": 0,
			"special_groups": 0
			},
		"mileage_by_group": {},
		"cost_by_car_type": {},
		"cost_by_energy_type": {},
		"CO2_by_car_type": {},
		"CO2_by_energy_type": {},
		"CO2_by_phase": {
			"CO2_from_driving": 0,
			"CO2_from_manufacturing": 0
		}
	}

	// Computes the TCO values for the whole fleet
	params.groups.forEach(function(group, group_id) {
		var group_insights = this.groups[group_id]["insights"]
		var group_name = params.groups[group_id]["name"]

		//Conversion from grams to tons
		group_insights.TCO.CO2 = group_insights.TCO.CO2 / 1000000

		// Total mileage with savings
		this.TCO.mileage_with_savings += group_insights.TCO.mileage

		// Total mileage 
		if (group_insights.energy_type != "savings") {
			this.TCO.mileage += group_insights.TCO.mileage
			this.TCO.mileage_overall += group_insights.TCO.mileage * group_insights.holding_time
		}

		// Total number of vehicles increases if it's not a special group
		if( SG_ENERGY_TYPES.indexOf(group_insights.energy_type) === -1 ) {
			this.TCO.fleet_num_of_vehicles += group_insights.num_of_vehicles
		}

		// Total cost
		this.TCO.total_costs += group_insights.TCO.total_costs
		// Total CO2
		this.TCO.CO2 += group_insights.TCO.CO2

		// Net cost by group
		this.TCO.cost_by_group[group_name] = group_insights.TCO.total_costs
		// CO2 by group
		this.TCO.CO2_by_group[group_name] = group_insights.TCO.CO2
		// Mileage by group
		this.TCO.mileage_by_group[group_name] = group_insights.TCO.mileage

		// Costs by position
		if (group_insights.car_type != "single_size") { // not for special groups
			this.TCO.cost_by_position.net_acquisition_cost += group_insights.TCO.net_acquisition_cost
		}
		this.TCO.cost_by_position.fixed_costs += group_insights.TCO.fixed_costs
		this.TCO.cost_by_position.variable_costs += group_insights.TCO.variable_costs
		this.TCO.cost_by_position.energy_costs += group_insights.TCO.energy_costs
		this.TCO.cost_by_position.charging_infrastructure += group_insights.TCO.charging_infrastructure
		if (group_insights.car_type == "single_size") {
			this.TCO.cost_by_position.special_groups += group_insights.TCO_simplified.net_cost
		}

		// CO2 by phase
		this.TCO.CO2_by_phase["CO2_from_driving"] += group_insights.TCO.CO2_from_driving / 1000000
		this.TCO.CO2_by_phase["CO2_from_manufacturing"] += group_insights.TCO.CO2_from_manufacturing / 1000000

		// Costs and CO2 by car type
		if (group_insights.car_type == "single_size") {
			// Special groups
			if (group_insights.energy_type in this.TCO.CO2_by_car_type) {
				this.TCO.CO2_by_car_type[group_insights.energy_type] += group_insights.TCO.CO2
				this.TCO.cost_by_car_type[group_insights.energy_type] += group_insights.TCO.total_costs
			} else {
				this.TCO.CO2_by_car_type[group_insights.energy_type] = group_insights.TCO.CO2
				this.TCO.cost_by_car_type[group_insights.energy_type] = group_insights.TCO.total_costs
			}

		}else{
			// Normal groups
			if (group_insights.car_type in this.TCO.CO2_by_car_type) {
				this.TCO.CO2_by_car_type[group_insights.car_type] += group_insights.TCO.CO2
				this.TCO.cost_by_car_type[group_insights.car_type] += group_insights.TCO.total_costs
			} else {
				this.TCO.CO2_by_car_type[group_insights.car_type] = group_insights.TCO.CO2
				this.TCO.cost_by_car_type[group_insights.car_type] = group_insights.TCO.total_costs
			}
		}

		// Costs and CO2 by energy type
		if (group_insights.energy_type in this.TCO.CO2_by_energy_type) {
			this.TCO.CO2_by_energy_type[group_insights.energy_type] += group_insights.TCO.CO2
			this.TCO.cost_by_energy_type[group_insights.energy_type] += group_insights.TCO.total_costs
		} else {
			this.TCO.CO2_by_energy_type[group_insights.energy_type] = group_insights.TCO.CO2
			this.TCO.cost_by_energy_type[group_insights.energy_type] = group_insights.TCO.total_costs
		}


	}, this);
	// CO2 per km in grams, converted to tons
	this.TCO.CO2_per_km["CO2_from_driving"] = (this.TCO.CO2_by_phase["CO2_from_driving"] * 1000000) / this.TCO.mileage_overall
	this.TCO.CO2_per_km["CO2_from_manufacturing"] = (this.TCO.CO2_by_phase["CO2_from_manufacturing"] * 1000000) / this.TCO.mileage_overall
	
	// cost per km
	this.TCO.cost_per_km = this.TCO.total_costs / this.TCO.mileage

	// Just to obtain the mileage_fleet var
	this.TCO.mileage_fleet = this.TCO.mileage
	this.fleet_presets.charging_option_cost = this.TCO.cost_by_position.charging_infrastructure

}

// Available from outisde
module.exports = Fleet;
module.exports.SG_ENERGY_TYPES = SG_ENERGY_TYPES; 

//  var myFleet = new Fleet(
// {
//       "name": "Optimierte Flotte",
//       "vars": {
//         "charging_option": "Wallbox 22kW",
//         "charging_option_num": 1
//       },
//       "groups": [
//         {
//           "vars": {
//             "group_name": "Lieferwagen Handwerker",
//             "num_of_vehicles": 2,
//             "energy_type": "diesel",
//             "car_type": "LNF1",
//             "mileage": 20000
//           }
//         },
//         {
//           "vars": {
//             "group_name": "Dienstwagen Geschäftsführerin",
//             "num_of_vehicles": 1,
//             "energy_type": "diesel",
//             "car_type": "groß",
//             "mileage": 14000
//           }
//         },
//         {
//           "vars": {
//             "group_name": "Poolfahrzeuge Verwaltung (Elekro-Fahrzeuge)",
//             "num_of_vehicles": 3,
//             "energy_type": "BEV",
//             "car_type": "klein",
//             "mileage": 12000
//           }
//         },
//         {
//           "name": "e-Bike",
//           "vars": {
//             "energy_type": "bike",
//             "mileage_special": 1000
//           }
//         }
//       ]
//     })
