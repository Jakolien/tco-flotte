(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Fleet = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],2:[function(require,module,exports){
var vehicle_group = require('./vehicle_group');
var extend = require("xtend");
var car_types = ["klein", "mittel", "groß", "LNF1", "LNF2"]
var energy_types = ["benzin", "diesel", "hybrid-benzin", "hybrid-diesel", "BEV"]
var charging_options = ["Keine","Wallbox 3.7kW","Wallbox bis 22kW","Ladesäule 22kW"]
var year_min = 2014
var year_max = 2050


var Fleet = function(params) {
	this.fleet_presets = {}
	this.params = params
	this.fleet_presets.electro_fleet_size = 0

	// Calculates the number of electric vehicles
	for (group_name in params.groups) {
		if (!(params.groups[group_name].hasOwnProperty("energy_type")) || params.groups[group_name].energy_type == "BEV" || params.groups[group_name].energy_type == "hybrid-benzin" || params.groups[group_name].energy_type == "hybrid-diesel") {
			this.fleet_presets.electro_fleet_size += params.groups[group_name].num_of_vehicles
		}
	}

	// Variables of the special groups
	this.fleet_presets.long_distance_train_CO2_per_km = .1
	this.fleet_presets.long_distance_train_cost_per_km = .9
	this.fleet_presets.short_distance_train_CO2_per_km = .05
	this.fleet_presets.short_distance_train_cost_per_km = .7
	this.fleet_presets.car_sharing_CO2_per_km = 1
	this.fleet_presets.car_sharing_cost_per_km = .2
	this.fleet_presets.rental_car_CO2_per_km = 1
	this.fleet_presets.rental_car_cost_per_km = 2
	this.fleet_presets.bike_CO2_per_km = 0
	this.fleet_presets.bike_cost_per_km = 0
	this.fleet_presets.plane_CO2_per_km = 100
	this.fleet_presets.plane_cost_per_km = 1.5

	// Financial variables
	this.fleet_presets.inflationsrate   = 0.015		// That's 1.5% per year
	this.fleet_presets.exchange_rate    = 1.25 		// How many $ for 1 €
	this.fleet_presets.discount_rate    = 0.05	    // 5% per year
	this.fleet_presets.abschreibungszeitraum = 6  	// amortization period
	this.fleet_presets.unternehmenssteuersatz = 30 	// corporate tax
	this.fleet_presets.sonder_afa = false			// special accounting rule to increase amortization for electro vehicles in the first year deactivated by default
	this.fleet_presets.praemie = true 			    // Cash bonus activated by default
	this.fleet_presets.praemie_bev = 4000
	this.fleet_presets.praemie_hybrid = 3000           

	// Energy prices in € per Liter and cents per kWh
	this.energy_known_prices = {
		"diesel": {
			"2014": 1.1349,
			"2015": 0.9841
		},
		"benzin": {
			"2014": 1.2843,
			"2015": 1.1711
		},
		"BEV": {
			"2014": .2449,
			"2015": .2410
		}
	}

	// Evolution of energy prices
	this.energy_prices_evolution = {
		"hydrocarbon": [
			{
				"start_year": 2014,
				"end_year": 2050,
				"rate": .02
			}
		],
		"strom": [
			{
				"start_year": 2014,
				"end_year": 2020,
				"rate": .013
			},
			{
				"start_year": 2021,
				"end_year": 2030,
				"rate": -.0028
			},
			{
				"start_year": 2031,
				"end_year": 2050,
				"rate": -.0058
			},	
		]
	}

	// Vehicle acquisition price
	this.fleet_presets.raw_acquisition_price = {}
	this.fleet_presets.nettolistenpreise = {
		"benzin":{
			"klein":{"2014": 10121},
			"mittel":{"2014": 16282},
			"groß":{"2014": 29595}
		},
		"diesel": {
			"LNF1":{"2014": 20346},
			"LNF2":{"2014": 34069}
		}
	}

	// Increase in acquisition prices
	this.fleet_presets.kostensteigerung20102030 = {
		"benzin":{
			"klein": 0.13769970166402,
			"mittel": 0.06650397416879,
			"groß": 0.03657428879589
		},
		"diesel":{
			"klein": 0.08550544026416,
			"mittel": 0.03211188878158,
			"groß": 0.02215547961983,
			"LNF1": .01,
			"LNF2": .01
		}
	}

	// Surcharge for the price of vehicle compared to benzin in EUR
	this.fleet_presets.aufpreis = {
		"diesel":{
			"klein": 2564,
			"mittel": 2340,
			"groß": 2232,
			"LNF1": 2000,
			"LNF2": 2500
		},
		"hybrid": {
			"klein": 1480,
			"mittel": 2425,
			"groß": 3830
		},
		"BEV":{
			"klein":{"2014": 1500},
			"mittel":{"2014": 2000},
			"groß":{"2014": 2500},
			"LNF1":{"2014": 2000},
			"LNF2":{"2014": 2500}
		}
	}

	// Variables for the battery
	this.fleet_presets.battery_price_per_KWh = {}
	this.fleet_presets.entladetiefe = 0.8
	this.fleet_presets.reichweite = 150 			// km
	this.fleet_presets.batteriepreise = {			// in € per kWh
		"2014": 400.0,	
		"2015": 380.0,
		"2016": 350.0,
		"2017": 300.0,
		"2018": 290.0

	}

	// Charging options costs in EUR
	this.fleet_presets.charging_option = "Wallbox bis 22kW"
	this.fleet_presets.maintenance_costs_charger = ""
	this.fleet_presets.energy_source = "strom_mix"
	this.fleet_presets.charging_option_cost = 0
	this.fleet_presets.charging_option_price = {}
	this.fleet_presets.charging_options = { 
		"Keine": { "acquisition": 0, "maintenance": 0},
		"Wallbox 3.7kW": { "acquisition": 350, "maintenance": 15},
		"Wallbox bis 22kW": { "acquisition": 800, "maintenance": 50},
		"Ladesäule 22kW": { "acquisition": 2600, "maintenance": 330},
		"Ladesäule 43.6kW": { "acquisition": 15250, "maintenance": 1600},
		"Ladesäule 100 kW DC": { "acquisition": 48500, "maintenance": 4600}	
	}

	// Variables for evolution of energy consumption in % of reduction per decade
	this.fleet_presets.verbrauchsentwicklung = {
		"benzin":  {"2010": -.3,  "2020": -.12},
		"diesel":  {"2010": -.26, "2020": -.1},
		"LNF":     {"2010": -.14, "2020": -.1},
		"BEV":     {"2010": -.15, "2020": -.01},
		"BEV-LNF": {"2010": 0,    "2020": -.01}
	}

	// Size of the engine (for oil consumption)
	this.fleet_presets.price_of_lubricant = 8
	this.fleet_presets.hubraum = {
		"benzin": {"klein": 1137, "mittel": 1375,"groß": 1780},
		"diesel": {"klein": 1383, "mittel": 1618,"groß": 1929, "LNF1": 1722, "LNF2": 2140}
	}

	// Consumption in liters or kWh per 100 km
	this.fleet_presets.verbrauch = {
		"benzin": {"klein": 6.94, "mittel": 8.08,"groß": 8.86},
		"diesel": {"klein": 4.99, "mittel": 6,"groß": 6.39, "LNF1": 8.4, "LNF2": 9.8},
		"BEV":    {"klein": .15, "mittel": .19,"groß": .21, "LNF1": .25, "LNF2": .30},
		"hybrid": {"klein": 5.21, "mittel": 6.06,"groß": 6.64}
					}

	// Hybrid fuel consumption discount
	this.fleet_presets.hybrid_minderverbrauch = {
		"klein" : .918,
		"mittel" : .9211,
		"groß" : .8725
	}

	// Hybrid lubricant consumption discount
	this.fleet_presets.hybrid_minderverbrauch_schmierstoff = .45

	//Number of days in the year when the vehicle is in use
	this.fleet_presets.einsatztage_pro_jahr = 250

	// Insurance in €/year
	this.fleet_presets.versicherung = {
		"benzin": {"klein": 721, "mittel": 836,"groß": 1025},
		"diesel": {"klein": 785, "mittel": 901,"groß": 1093, "LNF1": 903, "LNF2": 1209},
		"BEV":    {"klein": 721, "mittel": 836,"groß": 1025, "LNF1": 903, "LNF2": 1209}
					}

	// Yearly tax in €
	this.fleet_presets.kfzsteuer = {
		"benzin": {"klein": 66.6, "mittel": 108.5,"groß": 137.8},
		"diesel": {"klein": 105.33, "mittel": 193.19,"groß": 227.01, "LNF1": 293.63, "LNF2": 390.59},
		"hybrid-benzin": {"klein": 23, "mittel": 38,"groß": 48},
		"hybrid-diesel": {"klein": 37, "mittel": 68,"groß": 79},
		"BEV":    {"klein": 33.75, "mittel": 45,"groß": 56.25, "LNF1": 56.25, "LNF2": 67.5}
					}

	// Yearly check up in €
	this.fleet_presets.untersuchung = {
		"benzin": {"HU": 53.5, "AU": 41},
		"diesel": {"HU": 53.5, "AU": 41},
		"BEV":    {"HU": 53.5, "AU": 0}
					}

	// Variables for repairs
	this.fleet_presets.faktor_BEV = 0.82 	// Discount for repairs of electro vehicles
	this.fleet_presets.faktor_HEV = 0.96 	// Discount for repairs of hybrid vehicles
	this.fleet_presets.traffic_multiplicator = {
		"normaler Verkehr" : 1,
		"schwerer Verkehr" : 1.2,
		"sehr schwerer Verkehr" : 2
	}

	this.fleet_presets.reperaturkosten = {
		"benzin": {
			"klein": {
				"inspektion": 18.20,
				"reparatur": 28,
				"reifen": 12,
				"sonstige": 0
			},
			"mittel": {
				"inspektion": 19.6,
				"reparatur": 29.7,
				"reifen": 17.7,
				"sonstige": 0
			},
			"groß": {
				"inspektion": 22,
				"reparatur": 34.6,
				"reifen": 32.4,
				"sonstige": 0
			}  
		},
		"diesel": {
			"klein": {
				"inspektion": 19.4,
				"reparatur": 29.7,
				"reifen": 13.1,
				"sonstige": 0
			},
			"mittel": {
				"inspektion": 18.3,
				"reparatur": 30.4,
				"reifen": 19.9,
				"sonstige": 0
			},
			"groß": {
				"inspektion": 21.7,
				"reparatur": 34.4,
				"reifen": 27.4,
				"sonstige": 0
			},
			"LNF1": {
				"inspektion": 23,
				"reparatur": 32,
				"reifen": 18,
				"sonstige": 0
			},
			"LNF2": {
				"inspektion": 25,
				"reparatur": 41,
				"reifen": 26,
				"sonstige": 0
			}      
		}
	}

	// CO2 emission variables in kg per L or kg per kWh
	this.fleet_presets.CO2_from_electricity_mix = {}
	this.fleet_presets.co2_emissions = {
		"strom_mix": {
			"2012": 0.623,
			"2020": 0.395,
			"2030": 0.248
		},
		"strom_erneubar": 0.012,
		"benzin": 2.80,
		"diesel": 3.15
	}

	// CO2 produced when the vehicle is produced
	// Values here are temporary
	this.fleet_presets.CO2_from_manufacturing = {
		"benzin": {"klein": 66.6, "mittel": 108.5,"groß": 137.8},
		"diesel": {"klein": 105.33, "mittel": 193.19,"groß": 227.01, "LNF1": 293.63, "LNF2": 390.59},
		"hybrid-benzin": {"klein": 23, "mittel": 38,"groß": 48},
		"hybrid-diesel": {"klein": 37, "mittel": 68,"groß": 79},
		"BEV":    {"klein": 33.75, "mittel": 45,"groß": 56.25, "LNF1": 56.25, "LNF2": 67.5},
		"long_distance_train": {"single_size": 0},
		"short_distance_train": {"single_size": 0},
		"car_sharing": {"single_size": 0},
		"rental_car": {"single_size": 0},
		"bike": {"single_size": 0},
		"plane": {"single_size": 0}
	}

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

		this.evolution_elec_price_until_2020 = this.energy_prices_evolution["strom"][0]["rate"] * 100.0
		this.evolution_elec_price_until_2030 = this.energy_prices_evolution["strom"][1]["rate"] * 100.0
		this.evolution_elec_price_until_2050 = this.energy_prices_evolution["strom"][2]["rate"] * 100.0
		this.evolution_hydrocarbon_price_until_2050 = this.energy_prices_evolution["hydrocarbon"][0]["rate"] * 100.0

		// Finds out if the evolution rate has been changed by the user
		if (params.fleet_vars.hasOwnProperty("evolution_elec_price_until_2020")) {
			this.evolution_elec_price_until_2020 = params.fleet_vars["evolution_elec_price_until_2020"]
			this.energy_prices_evolution["strom"][0]["rate"] = params.fleet_vars["evolution_elec_price_until_2020"] / 100.0
		}
		if (params.fleet_vars.hasOwnProperty("evolution_elec_price_until_2030")) {
			this.evolution_elec_price_until_2030 = params.fleet_vars["evolution_elec_price_until_2030"]
			this.energy_prices_evolution["strom"][1]["rate"] = params.fleet_vars["evolution_elec_price_until_2030"] / 100.0
		}
		if (params.fleet_vars.hasOwnProperty("evolution_elec_price_until_2050")) {
			this.evolution_elec_price_until_2050 = params.fleet_vars["evolution_elec_price_until_2050"]
			this.energy_prices_evolution["strom"][2]["rate"] = params.fleet_vars["evolution_elec_price_until_2050"] / 100.0
		}
		if (params.fleet_vars.hasOwnProperty("evolution_hydrocarbon_price_until_2050")) {
			this.evolution_hydrocarbon_price_until_2050 = params.fleet_vars["evolution_hydrocarbon_price_until_2050"]
			this.energy_prices_evolution["hydrocarbon"][0]["rate"] = params.fleet_vars["evolution_hydrocarbon_price_until_2050"] / 100.0
		}
		if (params.fleet_vars.hasOwnProperty("_2016_elec_price")) {
			this.fleet_presets._2016_elec_price = params.fleet_vars["_2016_elec_price"]
			this.energy_known_prices["BEV"][2016] = params.fleet_vars["_2016_elec_price"]
		}
		if (params.fleet_vars.hasOwnProperty("_2016_diesel_price")) {
			this.fleet_presets._2016_diesel_price = params.fleet_vars["_2016_diesel_price"]
			this.energy_known_prices["diesel"][2016] = params.fleet_vars["_2016_diesel_price"]
		}
		if (params.fleet_vars.hasOwnProperty("_2016_benzin_price")) {
			this.fleet_presets._2016_benzin_price = params.fleet_vars["_2016_benzin_price"]
			this.energy_known_prices["benzin"][2016] = params.fleet_vars["_2016_benzin_price"]
		}

		for (var i in energy_types) {
			var energy_type = energy_types[i]["name"]
			var energy_source = energy_types[i]["source"]
			estimates[energy_type] = {}

			for (var year = 2014; year <= 2050; year++) {

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

				if (energy_type == "BEV"){
					estimates[energy_type][year]["pro"] = estimates[energy_type][year]["mittel"] * .9
		    		estimates[energy_type][year]["contra"] = estimates[energy_type][year]["mittel"] * 1.1
				} else {
					estimates[energy_type][year]["pro"] = estimates[energy_type][year]["mittel"] * 1.1
		    		estimates[energy_type][year]["contra"] = estimates[energy_type][year]["mittel"] * .9
				}
			}
		}

		this.fleet_presets.energy_prices = estimates
		this.fleet_presets._2016_elec_price = this.fleet_presets.energy_prices["BEV"][2016]["mittel"]
		this.fleet_presets._2016_diesel_price = this.fleet_presets.energy_prices["diesel"][2016]["mittel"]
		this.fleet_presets._2016_benzin_price = this.fleet_presets.energy_prices["benzin"][2016]["mittel"]

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
			for (type in starting_price["benzin"]) {
				if (energy_type != "benzin") {starting_price[energy_type][type] = {};}
				starting_price[energy_type][type]["2014"] = starting_price["benzin"][type]["2014"] + this.getPriceSurcharge(energy_type, type, year);
			}
			// Computes yearly price increase
			var yearly_increase = Math.pow((1 + this.fleet_presets.kostensteigerung20102030[energy_type][car_type]), (1/20)) - 1;
			// Computes the value for the asked year
			this.fleet_presets.raw_acquisition_price[energy_type][car_type][year] = starting_price[energy_type][car_type]["2014"] * Math.pow(1+yearly_increase, year - 2014)

		} else if (energy_type.indexOf("hybrid") > -1) { // hybrid car
			if (energy_type.indexOf("diesel") > -1) { //hybrid-diesel
				this.fleet_presets.raw_acquisition_price[energy_type][car_type][year] = this.fleet_presets.raw_acquisition_price["diesel"][car_type][year] + this.getPriceSurcharge("hybrid", car_type, year) + this.getPriceSurcharge("BEV", car_type, year);
			} else {
				this.fleet_presets.raw_acquisition_price[energy_type][car_type][year] = this.fleet_presets.raw_acquisition_price["benzin"][car_type][year] + this.getPriceSurcharge("hybrid", car_type, year) + this.getPriceSurcharge("BEV", car_type, year);
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
			for (var i = 2015; i<=2020; i++){ // Automates the fill out of surcharge
				for (type in surcharge) {
					surcharge[type][i] = surcharge[type][i - 1] * (1 + yearly_surcharge_deacrease);
				}
			}
			for (var i = 2021; i<=2049; i++){ // Automates the fill out of surcharge
				for (type in surcharge) {
					surcharge[type][i] = surcharge[type]["2020"];
				}
			}
			return surcharge[car_type][year]
		} else {
			return this.fleet_presets.aufpreis["hybrid"][car_type]
		}
	}

	this.setChargingOptionPrice = function(year) {
		// Decrease in price is 5%/year
		this.fleet_presets.charging_option_cost = this.fleet_presets.charging_options[this.fleet_presets.charging_option]["acquisition"] * Math.pow(1 - 0.05, year - 2014);
	}

	this.setChargingOptionMaintenance = function() {
		this.fleet_presets.maintenance_costs_charger = this.fleet_presets.charging_options[this.fleet_presets.charging_option]["maintenance"];
	}

	// Returns the price of the battery in E/kwh
	this.setBatteryPricePerKWh = function(year) {
		for (var i = 2019; i<=2025; i++) {
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
		
		for (var year = 2012; year<=2050; year++){
			if (year < 2020) {
			    estimates[year] = estimates["2012"] + (estimates["2020"] - estimates["2012"]) / 8 * (year - 2012)
			} 
			else if (year in this.fleet_presets.co2_emissions["strom_mix"]){
				estimates[year] = estimates[year]
			}
			else {
				var decade_start = Math.floor(year / 10) * 10
				var decade_end = Math.ceil(year / 10) * 10
				estimates[year] = estimates[decade_start] + ((estimates[decade_end] - estimates[decade_start]) / 10) * (year - decade_start)
			}
		}

		this.fleet_presets.CO2_from_electricity_mix = estimates
		
	}

	// Initializes the object that will hold every aquisition prices
	for (i in energy_types) {
		this.fleet_presets.raw_acquisition_price[energy_types[i]] = {}
		for (j in car_types) {
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
	for (k = year_min; k< year_max; k++) {
		this.setBatteryPricePerKWh(k)
	}

	// Initializes the prices of all charging options for all years
	this.setChargingOptionPrice(2016)
	this.setChargingOptionMaintenance()

	// Initializes the CO2 from the electricity mix
	this.setCO2FromElectricityMix()

	// Initializes the energy prices
	this.setEnergyPrices()

	// Updates the variables in case the Fleet receives user-input variables
	for(var prop in params.fleet_vars) {
    if( params.fleet_vars.hasOwnProperty(prop) && this.fleet_presets.hasOwnProperty(prop) ) {
			this.fleet_presets[prop] = params.fleet_vars[prop]
		}
	}

	// Initializes the object that will contain the groups
	this.groups = {}

	// Computes the TCO values for each vehicle group
	for (group in params.groups) {

		// In case forgotten
		if (params.groups[group].num_of_vehicles == undefined) { params.groups[group].num_of_vehicles = 1 }

		// For special groups
		if (params.groups[group].energy_type == "short_distance_train" || params.groups[group].energy_type == "plane" || params.groups[group].energy_type == "long_distance_train" || params.groups[group].energy_type == "car_sharing" || params.groups[group].energy_type == "rental_car" || params.groups[group].energy_type == "bike") { params.groups[group].car_type = "single_size" }
		
		num_of_vehicles = params.groups[group].num_of_vehicles

		// Creates the corresponding vehicle group
		this.groups[group] = new vehicle_group.VehicleGroup(this.fleet_presets, params.groups[group])
		current_group = this.groups[group]
		this.params.groups[group].TCO = {
			"CO2": current_group.CO2 * num_of_vehicles + this.fleet_presets.CO2_from_manufacturing[params.groups[group].energy_type][params.groups[group].car_type] * num_of_vehicles,
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
	}

	// Initializes the TCO values for the whole fleet
	this.TCO = {
		"mileage": 0,
		"CO2": 0,
		"total_costs": 0,
		"num_of_vehicles": 0,
		"CO2_per_km": 0,
		"cost_per_km": 0,
		"cost_by_group": {},
		"CO2_by_group": {},
		"cost_by_position": {"net_acquisition_cost": 0, "fixed_costs": 0, "variable_costs": 0, "energy_costs": 0, "charging_infrastructure":0},
		"mileage_by_group": {},
		"cost_by_car_type": {},
		"cost_by_energy_type": {},
		"CO2_by_car_type": {},
		"CO2_by_energy_type": {},
		"CO2_by_phase": {}
	}

	// Computes the TCO values for the whole fleet
	for (group_name in params.groups) {
		group = params.groups[group_name]

		// Total mileage
		this.TCO.mileage += group.TCO.mileage
		// Total number of vehicles increases if it's not a special group
		if (!(group.energy_type == "short_distance_train" || group.energy_type == "plane" || group.energy_type == "long_distance_train" || group.energy_type == "car_sharing" || group.energy_type == "rental_car" || group.energy_type == "bike")){
			this.TCO.num_of_vehicles += group.num_of_vehicles
		}
		// Total cost
		this.TCO.total_costs += group.TCO.total_costs
		// Total CO2
		this.TCO.CO2 += group.TCO.CO2

		// Net cost by group
		this.TCO.cost_by_group[group_name] = group.TCO.total_costs
		// CO2 by group
		this.TCO.CO2_by_group[group_name] = group.TCO.CO2
		// Mileage by group
		this.TCO.mileage_by_group[group_name] = group.TCO.mileage
		
		// Costs by position
		this.TCO.cost_by_position.net_acquisition_cost += group.TCO.net_acquisition_cost
		this.TCO.cost_by_position.fixed_costs += group.TCO.fixed_costs
		this.TCO.cost_by_position.variable_costs += group.TCO.variable_costs
		this.TCO.cost_by_position.energy_costs += group.TCO.energy_costs
		this.TCO.cost_by_position.charging_infrastructure += group.TCO.charging_infrastructure

		// CO2 by phase
		this.TCO.CO2_by_phase = {
			"CO2_from_driving": group.TCO.CO2 - this.fleet_presets.CO2_from_manufacturing[group.energy_type][group.car_type] * group.num_of_vehicles,
			"CO2_from_manufacturing": this.fleet_presets.CO2_from_manufacturing[group.energy_type][group.car_type] * group.num_of_vehicles
		}

		// Costs and CO2 by car type
		if (group.car_type == "single_size") {
			// Special groups
			if (group.energy_type in this.TCO.CO2_by_car_type) {
				this.TCO.CO2_by_car_type[group.energy_type] += group.TCO.CO2
				this.TCO.cost_by_car_type[group.energy_type] += group.TCO.total_costs
			} else {
				this.TCO.CO2_by_car_type[group.energy_type] = group.TCO.CO2
				this.TCO.cost_by_car_type[group.energy_type] = group.TCO.total_costs
			}

		}else{
			// Normal groups
			if (group.car_type in this.TCO.CO2_by_car_type) {
				this.TCO.CO2_by_car_type[group.car_type] += group.TCO.CO2
				this.TCO.cost_by_car_type[group.car_type] += group.TCO.total_costs
			} else {
				this.TCO.CO2_by_car_type[group.car_type] = group.TCO.CO2
				this.TCO.cost_by_car_type[group.car_type] = group.TCO.total_costs
			}
		}

		// Costs and CO2 by energy type
		if (group.energy_type in this.TCO.CO2_by_energy_type) {
			this.TCO.CO2_by_energy_type[group.energy_type] += group.TCO.CO2
			this.TCO.cost_by_energy_type[group.energy_type] += group.TCO.total_costs
		} else {
			this.TCO.CO2_by_energy_type[group.energy_type] = group.TCO.CO2
			this.TCO.cost_by_energy_type[group.energy_type] = group.TCO.total_costs
		}

	}
	// CO2 per km
	this.TCO.CO2_per_km = this.TCO.CO2 / this.TCO.mileage
	// cost per km
	this.TCO.cost_per_km = this.TCO.total_costs / this.TCO.mileage

}

module.exports = Fleet

console.log("Welcome to the eFleet computation engine!")
},{"./vehicle_group":3,"xtend":1}],3:[function(require,module,exports){
in_array = function(needle, haystack) {
    var i = haystack.length;
    while (i--) {
        if (haystack[i] == needle) {
            return true;
        }
    }
    return false;
}

var VehicleGroup = function(fleet_params, params) {
	var scenarios = ["mittel"]
	var additional_energy_types = ["long_distance_train","short_distance_train","car_sharing","rental_car","bike","plane"]
	this.energy_type = "BEV"
	this.car_type = "klein"
	this.electricity_consumption = 0
	this.mileage = 10000
	this.acquisition_year = 2016
	this.holding_time = 4
	this.reichweite = 150
	this.energy_source = fleet_params.energy_source
	this.electro_fleet_size = fleet_params.electro_fleet_size
	this.charging_option_cost = fleet_params.charging_option_cost / this.electro_fleet_size
	this.maintenance_costs_charger = fleet_params.maintenance_costs_charger / this.electro_fleet_size
	this.energy_prices = fleet_params.energy_prices
	this.traffic = "normaler Verkehr"
	this.training_option = "keine Schulung"
	this.share_electric = 55
	this.second_charge = false
	this.residual_value_method = "Methode 2"
	this.second_user_holding_time = 6
	this.second_user_yearly_mileage = 10000
	this.max_battery_charges = 2500
	this.battery_price = 0
	this.cash_bonus_amount = fleet_params.praemie_bev
	this.praemie = fleet_params.praemie
	this.sonder_afa = fleet_params.sonder_afa
	this.unternehmenssteuersatz = fleet_params.unternehmenssteuersatz
	this.abschreibungszeitraum = fleet_params.abschreibungszeitraum
	this.inflationsrate = fleet_params.inflationsrate * 100
	this.discount_rate = fleet_params.discount_rate * 100
	this.limited = false
	this.leasing = false
	this.leasing_rate = 0
	this.leasing_downpayment = 0
	this.leasing_endpayment = 0
	this.leasing_includes_insurance = false
	this.leasing_includes_tax = false
	this.leasing_includes_service = false
	this.leasing_residual_value = 0
	this.residual_value_fixed = 0 // the residual value to be displayed and input by the user

	for(var prop in params) {
    if( params.hasOwnProperty(prop) && this.hasOwnProperty(prop) ) {
			this[prop] = params[prop]
		}
	}

	if (this.car_type.indexOf("LNF") >= 0 && this.energy_type == "BEV"){
		this.reichweite = 130
	}

	this.share_electric_temp = this.share_electric
	this.charges_per_year = this.mileage / this.reichweite
	this.battery_duration = this.max_battery_charges / this.charges_per_year
	this.residual_value = {}
	this.price = {}
	this.maintenance_costs_total = this.maintenance_costs_repairs = this.maintenance_costs_tires = this.maintenance_costs_inspection = 0
	this.fixed_costs = {}
	this.energy_costs = {}
	this.amortization = {}

	this.TCO = {}
	this.TCO_simplified = {}
	this.CO2 = 0
	this.TCO_by_holding_time = {}
	this.TCO_by_acquisition_year = {}
	this.TCO_by_mileage = {}
	this.CO2_by_holding_time = {}
	this.CO2_by_acquisition_year = {}
	this.CO2_by_mileage = {}
	for (var i in scenarios) {
		this.TCO_by_holding_time[scenarios[i]] = {}
		this.TCO_by_acquisition_year[scenarios[i]] = {}
		this.TCO_by_mileage[scenarios[i]] = {}
		this.residual_value[scenarios[i]] = 0
	}

	// gets prices in the future after inflation
	this.getInflatedPrice = function(amount, period, inflation, rounded){
		if (inflation == undefined) { inflation = this.presets.inflationsrate }
		period = period - 1

		for (var i = 0; i <= period; i++) {
			amount *= (1 + inflation)
		}

		if (rounded == true) {
			return Math.round(amount)
		} else {
			return amount
		}
	}	

	this.getResidualValue = function(method){
		for (var i in scenarios) {
			var scenario = scenarios[i]

			if (this.energy_type == "diesel" || this.energy_type == "benzin"){
				this.residual_value[scenario] = Math.exp(fleet_params.restwert_constants["a"]) 										  // Constant
				this.residual_value[scenario] *= Math.exp(12 * fleet_params.restwert_constants["b1"] * (this.holding_time)) 			  // Age
				this.residual_value[scenario] *= Math.exp(fleet_params.restwert_constants["b2"] * this.mileage / 12)					 // Yearly mileage
				this.residual_value[scenario] *= Math.pow(this.price.total[scenario] - this.charging_option_cost, fleet_params.restwert_constants["b3"])				  // Initial price
			} else if (method == "Methode 1" && this.energy_type == "BEV"){
				temp_vehicle = new VehicleGroup(
											fleet_params,
											{
												energy_type: "diesel",
												car_type: this.car_type,
												mileage: this.mileage,
												acquisition_year: this.acquisition_year,
												holding_time: this.holding_time,
												traffic: this.traffic,
												second_user_holding_time: this.second_user_holding_time,
												second_user_yearly_mileage: this.second_user_yearly_mileage,
												unternehmenssteuersatz: this.unternehmenssteuersatz,
												abschreibungszeitraum: this.abschreibungszeitraum,
												inflationsrate: this.inflationsrate,
												discount_rate: this.discount_rate,
												energy_known_prices: this.energy_known_prices,
												energy_prices: this.energy_prices,
												fleet_params:this.fleet_params,
												limited: true
											})
				var residual_value_ratio = temp_vehicle.residual_value["mittel"] / temp_vehicle.acquisition_price

				delete temp_vehicle

				this.residual_value[scenario] = this.acquisition_price * residual_value_ratio

			}else if (method == "Methode 2"){

				// Computes the advantage of the 2d user
				var my_consumption = fuel_consumption = advantage_2d_user = 0

				for (var year2 = this.acquisition_year + this.holding_time; year2 < this.acquisition_year + this.holding_time + this.second_user_holding_time; year2++) {

					// Hybrid vehicles
					if (this.energy_type == "hybrid-benzin" || this.energy_type == "hybrid-diesel"){
						var energy_type = this.energy_type.split("-")[1]
						this.getConsumption(this.energy_type)
						my_consumption += (this.second_user_yearly_mileage / 100) * .55 * this.electricity_consumption * this.energy_prices["BEV"][year2]["mittel"];
						my_consumption += (this.second_user_yearly_mileage / 100) * .45 * this.fuel_consumption * this.energy_prices[energy_type][year2]["mittel"];

					} else {
						//computes consumption
						my_consumption += this.second_user_yearly_mileage * (this.electricity_consumption/100) * this.energy_prices["BEV"][year2][scenario]
					}
					//computes consumption of equivalent diesel vehicle
					this.getConsumption("diesel")
					fuel_consumption += this.second_user_yearly_mileage * (this.fuel_consumption/100) * this.energy_prices["diesel"][year2][scenario]
				}

				// Not for LNF
				if (this.car_type.indexOf("LNF") < 0){

					this.getConsumption("benzin")

					for (var year2 = this.acquisition_year + this.holding_time; year2 < this.acquisition_year + this.holding_time + this.second_user_holding_time; year2++) {
						//computes consumption of equivalent benzin vehicle
						fuel_consumption += this.second_user_yearly_mileage * (this.fuel_consumption/100) * this.energy_prices["benzin"][year2][scenario]
					}

					fuel_consumption = fuel_consumption/2
				}

				// Resets consumption for PHEV
				if (this.energy_type == "hybrid-benzin" || this.energy_type == "hybrid-diesel"){
					this.getConsumption(this.energy_type)
				}

				//computes difference
				advantage_2d_user = fuel_consumption - my_consumption

				temp_vehicle_diesel = new VehicleGroup(
										fleet_params,
										{
											energy_type: "diesel",
											car_type: this.car_type,
											mileage: this.mileage,
											acquisition_year: this.acquisition_year,
											holding_time: this.holding_time,
											traffic: this.traffic,
											second_user_holding_time: this.second_user_holding_time,
											second_user_yearly_mileage: this.second_user_yearly_mileage,
											unternehmenssteuersatz: this.unternehmenssteuersatz,
											abschreibungszeitraum: this.abschreibungszeitraum,
											inflationsrate: this.inflationsrate,
											discount_rate: this.discount_rate,
											energy_known_prices: this.energy_known_prices,
											energy_prices: this.energy_prices,
											limited: true
										})

				// Adds residual value of a Benzin vehicle if not LNF

				if (this.car_type != "LNF1" && this.car_type != "LNF2") {
					temp_vehicle_benzin = new VehicleGroup(
										fleet_params,
										{
											energy_type: "benzin",
											car_type: this.car_type,
											mileage: this.mileage,
											acquisition_year: this.acquisition_year,
											holding_time: this.holding_time,
											traffic: this.traffic,
											second_user_holding_time: this.second_user_holding_time,
											second_user_yearly_mileage: this.second_user_yearly_mileage,
											unternehmenssteuersatz: this.unternehmenssteuersatz,
											abschreibungszeitraum: this.abschreibungszeitraum,
											inflationsrate: this.inflationsrate,
											discount_rate: this.discount_rate,
											energy_known_prices: this.energy_known_prices,
											energy_prices: this.energy_prices,
											limited: true
										})

				}

				if (this.car_type == "LNF1" || this.car_type == "LNF2" || this.car_type == "groß"){
					this.residual_value[scenario] = temp_vehicle_diesel.residual_value["mittel"] + advantage_2d_user
				}
				else if (this.car_type == "mittel") {
					this.residual_value[scenario] = (temp_vehicle_diesel.residual_value["mittel"] + temp_vehicle_benzin.residual_value["mittel"]) / 2 + advantage_2d_user
				} else if (this.car_type == "klein") {
					this.residual_value[scenario] = temp_vehicle_benzin.residual_value["mittel"] + advantage_2d_user
				}


				delete temp_vehicle_benzin
				delete temp_vehicle_diesel

			} else if (method == "Methode 3"){
				// Creates temp diesel machine to get the residual value
				temp_vehicle = new VehicleGroup(
										fleet_params,
										{
											energy_type: "diesel",
											car_type: this.car_type,
											mileage: this.mileage,
											acquisition_year: this.acquisition_year,
											holding_time: this.holding_time,
											traffic: this.traffic,
											second_user_holding_time: this.second_user_holding_time,
											second_user_yearly_mileage: this.second_user_yearly_mileage,
											unternehmenssteuersatz: this.unternehmenssteuersatz,
											abschreibungszeitraum: this.abschreibungszeitraum,
											inflationsrate: this.inflationsrate,
											discount_rate: this.discount_rate,
											energy_known_prices: this.energy_known_prices,
											energy_prices: this.energy_prices,
											limited: true
										})
				this.residual_value[scenario] = temp_vehicle.residual_value["mittel"]
				delete temp_vehicle

			}
		}

		this.residual_value_fixed = this.residual_value["mittel"]
		if (params.hasOwnProperty("residual_value_fixed")) {
			this.residual_value_fixed = params["residual_value_fixed"]
			this.residual_value["mittel"] = params["residual_value_fixed"]
			this.residual_value["pro"] = params["residual_value_fixed"]
			this.residual_value["contra"] = params["residual_value_fixed"]
		}
	}

	this.getMaintenanceCosts = function(){
		if (!(this.energy_type =="BEV" || this.energy_type.indexOf("hybrid") > -1)) {
			this.maintenance_costs_charger = 0
		}
		if (this.energy_type == "BEV" && this.car_type.indexOf("LNF") == -1) {
			this.maintenance_costs_tires = fleet_params.reperaturkosten["benzin"][this.car_type]["reifen"] ;
			this.maintenance_costs_inspection = fleet_params.reperaturkosten["benzin"][this.car_type]["inspektion"];
			this.maintenance_costs_repairs = fleet_params.reperaturkosten["benzin"][this.car_type]["reparatur"] * fleet_params.faktor_BEV;
		} else if (this.energy_type == "BEV" && this.car_type.indexOf("LNF") >= 0) {
			this.maintenance_costs_tires = fleet_params.reperaturkosten["diesel"][this.car_type]["reifen"];
			this.maintenance_costs_inspection = fleet_params.reperaturkosten["diesel"][this.car_type]["inspektion"];
			this.maintenance_costs_repairs = fleet_params.reperaturkosten["diesel"][this.car_type]["reparatur"] * fleet_params.faktor_BEV;
		} else if (this.energy_type.indexOf("hybrid") > -1) { // Takes the same value of the non-hybrid of same type
			this.maintenance_costs_tires = fleet_params.reperaturkosten[this.energy_type.split("-")[1]][this.car_type]["reifen"];
			this.maintenance_costs_inspection = fleet_params.reperaturkosten[this.energy_type.split("-")[1]][this.car_type]["inspektion"];
			this.maintenance_costs_repairs = fleet_params.reperaturkosten[this.energy_type.split("-")[1]][this.car_type]["reparatur"]
		}
		else {
			this.maintenance_costs_tires = fleet_params.reperaturkosten[this.energy_type][this.car_type]["reifen"];
			this.maintenance_costs_inspection = fleet_params.reperaturkosten[this.energy_type][this.car_type]["inspektion"];
			this.maintenance_costs_repairs = fleet_params.reperaturkosten[this.energy_type][this.car_type]["reparatur"];
		}

		this.maintenance_costs_tires = ((this.maintenance_costs_tires * 12) / 20000) * this.mileage * this.traffic_multiplicator;
		this.maintenance_costs_inspection = ((this.maintenance_costs_inspection * 12) / 20000) * this.mileage * this.traffic_multiplicator;
		this.maintenance_costs_repairs = ((this.maintenance_costs_repairs * 12) / 20000) * this.mileage * this.traffic_multiplicator


		if (params.hasOwnProperty("maintenance_costs_tires")) {
			this.maintenance_costs_tires = params["maintenance_costs_tires"]
		}
		if (params.hasOwnProperty("maintenance_costs_inspection")) {
			this.maintenance_costs_inspection = params["maintenance_costs_inspection"]
		}
		if (params.hasOwnProperty("maintenance_costs_repairs")) {
			this.maintenance_costs_repairs = params["maintenance_costs_repairs"]
		}
		if (params.hasOwnProperty("maintenance_costs_charger")) {
			this.maintenance_costs_charger = params["maintenance_costs_charger"] / this.electro_fleet_size
		}

		this.maintenance_costs_total = this.maintenance_costs_tires + this.maintenance_costs_inspection + this.maintenance_costs_repairs;

	}

	this.getAcquisitionPrice = function() {
		this.price.total = {}
		this.price.battery_price = {}
		for (var i in scenarios) {
			var scenario = scenarios[i]
			if (this.energy_type == "benzin" || this.energy_type == "diesel") {
				this.price.basis_price = fleet_params.raw_acquisition_price[this.energy_type][this.car_type][this.acquisition_year]
				this.acquisition_price = this.price.basis_price
				this.charging_option_cost = 0
				if (params.hasOwnProperty("acquisition_price")) {
					this.acquisition_price = params["acquisition_price"]
					this.price.basis_price = params["acquisition_price"]
				}
				this.price.total[scenario] = this.price.basis_price
				this.price.battery_price[scenario] = 0
			} else {

				this.price.basis_price = fleet_params.raw_acquisition_price[this.energy_type][this.car_type][this.acquisition_year]
				this.price.battery_price[scenario] = this.getBatteryPrice(scenario)
				if (params.hasOwnProperty("charging_option_cost")) {
					this.charging_option_cost = params["charging_option_cost"]  / this.electro_fleet_size
				}
				this.acquisition_price = this.price.basis_price + this.price.battery_price["mittel"]
				if (params.hasOwnProperty("acquisition_price")) {
					this.acquisition_price = params["acquisition_price"]
					this.price.basis_price = params["acquisition_price"] - this.price.battery_price["mittel"]
				}
				this.price.total[scenario] = this.price.basis_price + this.price.battery_price[scenario] + this.charging_option_cost
			}

			// Takes into accont the special cash reward
			if (this.praemie == true) {
				if (this.acquisition_year >= 2016 && this.acquisition_year < 2020 && this.acquisition_price < 60000) {
						if (this.energy_type == "hybrid-benzin" || this.energy_type == "hybrid-diesel"){
							this.cash_bonus_amount = fleet_params.praemie_hybrid
						}
					    else if (this.energy_type == "BEV"){
					    	this.cash_bonus_amount = fleet_params.praemie_bev
						}
						else {
							this.cash_bonus_amount = 0
						}
					this.price.total[scenario] -= this.cash_bonus_amount
				} else {
					this.cash_bonus_amount = 0
				}
			} else {
				this.cash_bonus_amount = 0
			}
		}
	}

	this.getBatteryPrice = function() {

		return this.battery_size * fleet_params.battery_price_per_KWh[this.acquisition_year]
	}

	this.getNeededBatterySize = function() {
		if (this.energy_type.indexOf("hybrid") > -1 ) {
			this.reichweite = 50
		}
		var capacity = this.reichweite * (this.electricity_consumption / 100) / fleet_params.entladetiefe
		var actual_capacity = capacity * fleet_params.entladetiefe
		this.battery_size = actual_capacity
	}

	this.getFixedCosts = function() {

		if (this.energy_type.indexOf("hybrid") > -1) {
			energy_type = this.energy_type.split("-")[1]
		} else {
			energy_type = this.energy_type
		}

		if (this.energy_type == "BEV" && this.acquisition_year >= 2021) {
			this.fixed_costs_car_tax = fleet_params.kfzsteuer[this.energy_type][this.car_type]
		} else {
			this.fixed_costs_car_tax = fleet_params.kfzsteuer[this.energy_type][this.car_type]
		}
		this.fixed_costs_check_up = fleet_params.untersuchung[energy_type]["AU"] + fleet_params.untersuchung[energy_type]["HU"]
		this.fixed_costs_insurance = fleet_params.versicherung[energy_type][this.car_type]


		if (params.hasOwnProperty("fixed_costs_car_tax")) {
			this.fixed_costs_car_tax = params["fixed_costs_car_tax"]
			fleet_params.kfzsteuer["BEV"][this.car_type] = params["fixed_costs_car_tax"]
		}
		if (params.hasOwnProperty("fixed_costs_check_up")) {
			this.fixed_costs_check_up = params["fixed_costs_check_up"]
		}
		if (params.hasOwnProperty("fixed_costs_insurance")) {
			this.fixed_costs_insurance = params["fixed_costs_insurance"]
		}

		// Overrides user-defined tax level if year is less than 2021
		if (this.energy_type == "BEV" && this.acquisition_year < 2021) {
			this.fixed_costs_car_tax = 0
		}

		this.fixed_costs.car_tax = this.fixed_costs_car_tax
		this.fixed_costs.check_up = this.fixed_costs_check_up
		this.fixed_costs.insurance = this.fixed_costs_insurance

		// Special case for leasing, which can include insurance etc.
		if (this.leasing_includes_insurance) {
			this.fixed_costs.insurance = 0
			this.fixed_costs_insurance = 0
		}
		if (this.leasing_includes_tax) {
			this.fixed_costs.car_tax = 0
			this.fixed_costs_car_tax = 0
		}
		if (this.leasing_includes_service) {
			this.fixed_costs.check_up = 0
			this.fixed_costs_check_up = 0
		}

		// Adds up all fixed costs
		this.fixed_costs.total = this.fixed_costs.car_tax + this.fixed_costs.check_up + this.fixed_costs.insurance
		this.fixed_costs_total = this.fixed_costs.car_tax + this.fixed_costs.check_up + this.fixed_costs.insurance
	}

	this.getLubricantConsumption = function() {
		if (this.energy_type == "BEV") { return 0 }
		else if (this.energy_type.indexOf("hybrid") > -1 ) {
			var energy_type = this.energy_type.split("-")[1];
		} else {
			var energy_type = this.energy_type;
		}
		var lubricant_consumption = fleet_params.hubraum[energy_type][this.car_type] / 2000 * (0.5/1000);

		if (this.energy_type.indexOf("hybrid") > -1 ) { //special case for hybrids
			return fleet_params.price_of_lubricant * lubricant_consumption * fleet_params.hybrid_minderverbrauch_schmierstoff
		}

		return fleet_params.price_of_lubricant * lubricant_consumption;
	}

	this.getLubricantCosts = function() {
		this.lubricant_costs = this.getLubricantConsumption() * this.mileage;
	}

	this.getConsumption = function(energy_type) {
		if (energy_type.indexOf("hybrid") > -1) {
			this.getConsumption("BEV");
			this.getConsumption(energy_type.split("-")[1]);
			this.fuel_consumption *= fleet_params.hybrid_minderverbrauch[this.car_type];
		} else {
			this.fuel_consumption = fleet_params.verbrauch[energy_type][this.car_type];
			var improvement_first_decade = fleet_params.verbrauchsentwicklung[energy_type]["2010"];
			var yearly_improvement_first_decade = Math.pow((1 + improvement_first_decade), (1/10)) - 1;
			var improvement_second_decade = fleet_params.verbrauchsentwicklung[energy_type]["2020"];
			var yearly_improvement_second_decade = Math.pow(1 + improvement_second_decade, .1) - 1;

			// Need to take into account the rate of improvement of the previous decade
			if (this.acquisition_year > 2020) {
				this.fuel_consumption *= Math.pow(1+yearly_improvement_first_decade, this.acquisition_year - 2014);
				this.fuel_consumption *= Math.pow(1+yearly_improvement_second_decade, this.acquisition_year - 2020);
			} else {
				this.fuel_consumption *= Math.pow(1+yearly_improvement_first_decade, this.acquisition_year - 2014);
			}

			// Because the information for electric cars is in kWh per km
			if (energy_type == "BEV") {
				this.electricity_consumption = this.fuel_consumption * 100;
				this.fuel_consumption = 0;
			}
		}

		if (params.hasOwnProperty("fuel_consumption")) {
			this.fuel_consumption = params["fuel_consumption"]
		}
		if (params.hasOwnProperty("electricity_consumption")) {
			this.electricity_consumption = params["electricity_consumption"]
		}

	}

	this.getEnergyCosts = function(){
		if (this.energy_type == "benzin" || this.energy_type == "diesel") {
			for (var year = this.acquisition_year; year <= 2049; year++) {
				this.energy_costs[year] = {}
				this.energy_costs[year]["pro"] = (this.mileage / 100) * this.fuel_consumption * this.energy_prices[this.energy_type][year]["pro"];
				this.energy_costs[year]["mittel"] = (this.mileage / 100) * this.fuel_consumption * this.energy_prices[this.energy_type][year]["mittel"];
				this.energy_costs[year]["contra"] = (this.mileage / 100) * this.fuel_consumption * this.energy_prices[this.energy_type][year]["contra"];
			}
		} else if (this.energy_type == "BEV") {
			for (var year = this.acquisition_year; year <= 2049; year++) {
				this.energy_costs[year] = {}
				this.energy_costs[year]["pro"] = (this.mileage / 100) * this.electricity_consumption * this.energy_prices[this.energy_type][year]["pro"];
				this.energy_costs[year]["mittel"] = (this.mileage / 100) * this.electricity_consumption * this.energy_prices[this.energy_type][year]["mittel"];
				this.energy_costs[year]["contra"] = (this.mileage / 100) * this.electricity_consumption * this.energy_prices[this.energy_type][year]["contra"];
			}
		} else { //Hybrid vehicles
			var energy_type = this.energy_type.split("-")[1];

			for (var year = this.acquisition_year; year <= 2049; year++) {
				this.energy_costs[year] = {}
				this.energy_costs[year]["pro"] = (this.mileage / 100) * this.share_electric / 100 * this.electricity_consumption * this.energy_prices["BEV"][year]["pro"];
				this.energy_costs[year]["pro"] += (this.mileage / 100) * (1 - this.share_electric / 100) * this.fuel_consumption * this.energy_prices[energy_type][year]["mittel"];
				this.energy_costs[year]["mittel"] = (this.mileage / 100) * this.share_electric / 100 * this.electricity_consumption * this.energy_prices["BEV"][year]["mittel"];
				this.energy_costs[year]["mittel"] += (this.mileage / 100) * (1 - this.share_electric / 100) * this.fuel_consumption * this.energy_prices[energy_type][year]["mittel"];
				this.energy_costs[year]["contra"] = (this.mileage / 100) * this.share_electric / 100 * this.electricity_consumption * this.energy_prices["BEV"][year]["contra"];
				this.energy_costs[year]["contra"] += (this.mileage / 100) * (1 - this.share_electric / 100) * this.fuel_consumption * this.energy_prices[energy_type][year]["mittel"];
			}
		}
	}

	this.getAmortization = function() {
		for (var i in scenarios) {
			this.amortization[scenarios[i]] = {}
			var scenario = scenarios[i]

			for (var year = this.acquisition_year; year <= 2035; year++) {

				// Computes the amortization of the vehicle
				if (year < this.acquisition_year + this.abschreibungszeitraum){
					if (year == this.acquisition_year && this.sonder_afa == true && this.energy_type=="BEV"){
						this.amortization[scenario][year] = (this.price.basis_price + this.price.battery_price[scenario]) * .5 * (this.unternehmenssteuersatz / 100)
					} else if (this.sonder_afa == true && this.energy_type=="BEV") {
						this.amortization[scenario][year] = (1 / this.abschreibungszeitraum) * (this.unternehmenssteuersatz / 100) * (this.price.basis_price + this.price.battery_price[scenario]) * .5
					} else {
						//Normal amortization
						this.amortization[scenario][year] = (1 / this.abschreibungszeitraum) * (this.unternehmenssteuersatz / 100) * (this.price.basis_price + this.price.battery_price[scenario])
					}
				} else {
					this.amortization[scenario][year] = 0
				}
			}
		}
	}

	this.checkMaxElecShare = function() {

		// Checks that the max elec share input by the user is right. If not, set it to max
		var daily_mileage = this.mileage / fleet_params.einsatztage_pro_jahr;

		var max_elec_share = (this.reichweite / daily_mileage) * 100;

		if (this.second_charge === true) {
			max_elec_share = ((this.reichweite * 2) / daily_mileage) * 100;
		}


		if (max_elec_share > 100){ max_elec_share = 100 }
		if (this.share_electric >= max_elec_share) {
			this.share_electric = max_elec_share
		} else {
			if (params.hasOwnProperty("share_electric")) {
				this.share_electric = params["share_electric"]

			} else {
				this.share_electric = this.share_electric_temp

			}
		}

	}

	this.getLeasingRate = function() {
		this.leasing_residual_value = - this.residual_value["mittel"]
		return Math.round((this.acquisition_price + this.residual_value["mittel"] - this.leasing_downpayment - this.leasing_endpayment) / (this.holding_time * 12))
	}

	this.getYearlyCosts = function(scenario, year){
		var costs = {}

		if (params.hasOwnProperty("inflationsrate")) {
			this.inflationsrate = params["inflationsrate"]
		}

		if (params.hasOwnProperty("discount_rate")) {
			this.discount_rate = params["discount_rate"]
		}

		costs["fixed_costs"] = {
			"check_up" : this.getInflatedPrice(this.fixed_costs.check_up, year - this.acquisition_year, this.inflationsrate/100, true),
			"insurance" : this.getInflatedPrice(this.fixed_costs.insurance, year - this.acquisition_year, this.inflationsrate/100, true),
			"car_tax" : this.getInflatedPrice(this.fixed_costs.car_tax, year - this.acquisition_year, this.inflationsrate/100, true)
		}



		costs["energy_costs"] = this.getInflatedPrice(this.energy_costs[year][scenario], year - this.acquisition_year, this.inflationsrate/100, true)

		costs["variable_costs"] = {
			"lubricant_costs": this.getInflatedPrice(this.lubricant_costs, year - this.acquisition_year, this.inflationsrate/100, true),
			"maintenance_costs": this.getInflatedPrice(this.maintenance_costs_total, year - this.acquisition_year, this.inflationsrate/100, true),
			"amortization": - this.getInflatedPrice((this.maintenance_costs_total + this.lubricant_costs) * (this.unternehmenssteuersatz / 100), year - this.acquisition_year, this.inflationsrate/100, true)
		}

		costs["maintenance_charger"] =  this.getInflatedPrice(this.maintenance_costs_charger, this.inflationsrate/100, true)

		costs["amortization_vehicle"] = Math.round(- this.amortization[scenario][year])

		// Special case for BEV vehicles older than 6 years
		if (this.energy_type == "BEV" && (year - 2014) >= 6) {
			costs["fixed_costs"]["car_tax"] = this.getInflatedPrice(fleet_params.kfzsteuer[this.energy_type][this.car_type], year - this.acquisition_year, this.inflationsrate/100, true)
		} else if (this.energy_type == "BEV" && (year - 2014) < 6) {
			costs["fixed_costs"]["car_tax"] = 0
		}

		// No car tax for the first 10 years for a BEV vehicle
		if (year - this.acquisition_year < 10 && this.energy_type == "BEV") {
			costs["fixed_costs"]["car_tax"] = 0
		}

		costs["total_cost"] = Math.round(costs["fixed_costs"]["check_up"] + costs["maintenance_charger"] + costs["fixed_costs"]["insurance"] + costs["fixed_costs"]["car_tax"] + costs["energy_costs"] + costs["variable_costs"]["lubricant_costs"] + costs["variable_costs"]["maintenance_costs"] + costs["variable_costs"]["amortization"] - this.amortization[scenario][year])

		costs = this.discountCosts(costs, year - this.acquisition_year)

		return costs
	}

	this.getYearlyCO2 = function(year){

		co2 = 0;

		if (this.energy_type == "BEV") {
			if (this.energy_source == "strom_mix") {
				co2 = (this.mileage / 100) * this.electricity_consumption * fleet_params.CO2_from_electricity_mix[year]
			}
			else if (this.energy_source == "strom_erneubar") {
				co2 = (this.mileage / 100) * this.electricity_consumption * fleet_params.co2_emissions[this.energy_source]
			}
		}

		else if (this.energy_type.indexOf("hybrid") > -1) {

			if (this.energy_source == "strom_mix") {
				co2 = (this.mileage / 100) * (this.share_electric /100) *  this.electricity_consumption * fleet_params.CO2_from_electricity_mix[year]
			} else if (this.energy_source == "strom_erneubar") {
				co2 = (this.mileage / 100) * this.electricity_consumption * fleet_params.co2_emissions[this.energy_source]
			}

			co2 += (this.mileage / 100) * (1-this.share_electric /100) *  this.fuel_consumption * fleet_params.co2_emissions[this.energy_type.split("-")[1]]
		}
		else {
			co2 = (this.mileage / 100) * this.fuel_consumption * fleet_params.co2_emissions[this.energy_type]
		}

		return Math.round(co2)
	}

	this.initCosts = function(scenario){
		// Acquisition and one-off costs
		costs = {}
		costs["vehicle_basis_cost"] = Math.round(this.price.basis_price + this.price.battery_price[scenario])

		costs["charging_infrastructure"] = Math.round(this.charging_option_cost)

		costs["total_cost"] = Math.round(this.price.total[scenario])

		costs["cash_bonus"] = Math.round(this.cash_bonus_amount)

		costs["residual_value"] = - this.residual_value[scenario]
		costs["residual_value"] = this.getInflatedPrice(costs["residual_value"], this.holding_time - 1, this.inflationsrate/100, false)
		costs["residual_value"] = Math.round(costs["residual_value"] / Math.pow(1 + this.discount_rate/100, this.holding_time - 1))

		// Init vars
		costs["variable_costs"] = {}
		costs["fixed_costs"] = {}
		costs["energy_costs"] = 0
		costs["variable_costs"]["lubricant_costs"] = 0
		costs["variable_costs"]["maintenance_costs"] = 0
		costs["variable_costs"]["amortization"] = 0
		costs["amortization_vehicle"] = 0
		costs["fixed_costs"]["check_up"] = 0
		costs["fixed_costs"]["insurance"] = 0
		costs["fixed_costs"]["car_tax"] = 0

		return costs
	}

	this.incrementCosts = function(costs, yearly_costs) {
		costs["energy_costs"] += yearly_costs["energy_costs"]
		costs["variable_costs"]["lubricant_costs"] += yearly_costs["variable_costs"]["lubricant_costs"]
		costs["variable_costs"]["maintenance_costs"] += yearly_costs["variable_costs"]["maintenance_costs"]
		costs["variable_costs"]["amortization"] += yearly_costs["variable_costs"]["amortization"]
		costs["amortization_vehicle"] += yearly_costs["amortization_vehicle"]
		costs["total_cost"] += yearly_costs["total_cost"]
		costs["fixed_costs"]["check_up"] += yearly_costs["fixed_costs"]["check_up"]
		costs["fixed_costs"]["insurance"] += yearly_costs["fixed_costs"]["insurance"]
		costs["fixed_costs"]["car_tax"] += yearly_costs["fixed_costs"]["car_tax"]
		costs["charging_infrastructure"] += yearly_costs["maintenance_charger"]

		return costs
	}

	this.keys = function(obj) {
		var keys = [];

		for (var i in obj) {
			if (obj.hasOwnProperty(i)) {
				keys.push(i);
			}
		}

		return keys;
	}

	this.discountCosts = function(costs, period) {

		// discounts all positions
		for (var i in costs) {
			if (this.keys(costs[i] || {}).length > 0){

				for (var j in costs[i]) {
					costs[i][j] = Math.round(costs[i][j] / Math.pow(1 + this.discount_rate/100, period))
				}
			} else {
				costs[i] = Math.round(costs[i] / Math.pow(1 + this.discount_rate/100, period))
			}
		}

		return costs
	}

	this.getTCO = function() {
		this.TCO = this.TCO_by_holding_time["mittel"][this.holding_time]
		this.CO2 = this.CO2_by_holding_time[this.holding_time]

		this.TCO_simplified["net_cost"] = this.TCO.vehicle_basis_cost + this.TCO.residual_value + this.TCO.amortization_vehicle - this.cash_bonus_amount
		this.TCO_simplified["charging_infrastructure"] = this.TCO.charging_infrastructure
		this.TCO_simplified["fixed_costs"] = this.TCO.fixed_costs.check_up + this.TCO.fixed_costs.insurance + this.TCO.fixed_costs.car_tax
		this.TCO_simplified["variable_costs"] = this.TCO.variable_costs.lubricant_costs + this.TCO.variable_costs.maintenance_costs + this.TCO.variable_costs.amortization
		this.TCO_simplified["energy_costs"] = this.TCO.energy_costs
	}

	this.getTCOByHoldingTime = function(){

		for (var i in scenarios) {
			var scenario = scenarios[i];

			var holding_time_temp = this.holding_time

			for (var holding_time = 1; holding_time <= 12; holding_time++){
				this.holding_time = holding_time
				this.computeCosts()
				costs = this.initCosts(scenario)
				co2 = 0

				for (var current_year = this.acquisition_year; current_year < holding_time + this.acquisition_year; current_year++){

					//Yearly costs
					var yearly_costs = this.getYearlyCosts(scenario, current_year)

					costs = this.incrementCosts(costs, yearly_costs)
					co2 += this.getYearlyCO2(current_year)
				}

				// Removes the resale value
				costs["total_cost"] += costs["residual_value"]

				this.TCO_by_holding_time[scenario][holding_time] = costs
				this.CO2_by_holding_time[holding_time] = co2

			}

			// goes back to initial positions
			this.holding_time = holding_time_temp
			this.computeCosts()
		}
	}

	this.computeCosts = function(fixed_vars) {

		if (params != fixed_vars && fixed_vars != undefined){
			params = extend(params, fixed_vars);
			for(var prop in fixed_vars) {
			    if(fixed_vars.hasOwnProperty(prop) && this.hasOwnProperty(prop) ) {
						this[prop] = fixed_vars[prop]
				}
			}

			this.computeTotals()
		}
		this.traffic_multiplicator = fleet_params.traffic_multiplicator[this.traffic];
		this.getFixedCosts();

		if (this.energy_type.indexOf("hybrid") > -1 ) {
			this.checkMaxElecShare();
		}

		this.getNeededBatterySize()
		this.getAcquisitionPrice()
		this.getMaintenanceCosts()
		this.getLubricantCosts()
		this.getConsumption(this.energy_type)
		this.getEnergyCosts()
		this.getAmortization()
		this.getResidualValue(this.residual_value_method)
		this.leasing_rate = this.getLeasingRate()

		//Rounds all visible values to 2 decimal places
		this.fuel_consumption = this.fuel_consumption
		this.electricity_consumption = Math.round(this.electricity_consumption * 100)/100
		this.maintenance_costs_total = Math.round(this.maintenance_costs_total)
		this.maintenance_costs_repairs = Math.round(this.maintenance_costs_repairs * 100)/100
		this.maintenance_costs_inspection = Math.round(this.maintenance_costs_inspection * 100)/100
		this.maintenance_costs_tires = Math.round(this.maintenance_costs_tires * 100)/100
		this.lubricant_costs = Math.round(this.lubricant_costs * 100)/100
		this.residual_value_fixed = Math.round(this.residual_value_fixed * 100)/100
		this.fuel_consumption = Math.round(this.fuel_consumption * 100)/100
		this.acquisition_price = Math.round(this.acquisition_price)

	}

	this.computeTotals = function(){
		this.computeCosts()
		this.getTCOByHoldingTime()
		this.getTCO()
	}

	// Checks if this is a special group
	if (in_array(this.energy_type, additional_energy_types)) {
		// Cleans some of the properties of this special group
		this.car_type = "single_size"
		this.num_of_vehicles = 1
		this.TCO_simplified.net_cost = this.mileage * eval("fleet_params."+ this.energy_type +"_cost_per_km")
		this.TCO_simplified.charging_infrastructure = 0
		this.TCO_simplified.energy_costs = 0
		this.TCO_simplified.variable_costs = 0
		this.TCO_simplified.fixed_costs = 0
		this.CO2 = this.mileage * eval("fleet_params."+ this.energy_type +"_CO2_per_km")
	} else {
	// Proceeds to the regular calculations
		this.computeCosts()
			if (this.limited == false){
				this.computeTotals()
			}
	}
}

exports.VehicleGroup = VehicleGroup
},{}]},{},[2])(2)
});