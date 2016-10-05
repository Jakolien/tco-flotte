var in_array = function(needle, haystack) {
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

				// delete temp_vehicle // Deleting variable is forbidden in strict mode!
        temp_vehicle = null;

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


				// delete temp_vehicle_benzin  // Deleting variable is forbidden in strict mode!
        temp_vehicle_benzin = null;
				// delete temp_vehicle_diesel  // Deleting variable is forbidden in strict mode!
        temp_vehicle_diesel = null;

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
				// delete temp_vehicle // Deleting variable is forbidden in strict mode!
        temp_vehicle = null
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
			var energy_type = this.energy_type.split("-")[1]
		} else {
			var energy_type = this.energy_type
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

		var co2 = 0;

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
		var costs = {}
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
    var costs, co2;

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
