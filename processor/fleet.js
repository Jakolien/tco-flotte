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
	for (var group_name in params.groups) {
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
			for (var type in starting_price["benzin"]) {
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
	for(var group in params.groups) {

		// In case forgotten
		if (params.groups[group].num_of_vehicles == undefined) { params.groups[group].num_of_vehicles = 1 }

		// For special groups
		if (params.groups[group].energy_type == "short_distance_train" || params.groups[group].energy_type == "plane" || params.groups[group].energy_type == "long_distance_train" || params.groups[group].energy_type == "car_sharing" || params.groups[group].energy_type == "rental_car" || params.groups[group].energy_type == "bike") { params.groups[group].car_type = "single_size" }

		var num_of_vehicles = params.groups[group].num_of_vehicles

		// Creates the corresponding vehicle group
		this.groups[group] = new vehicle_group.VehicleGroup(this.fleet_presets, params.groups[group])
		var current_group = this.groups[group]
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
	for (var group_name in params.groups) {
		var group = params.groups[group_name]

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
