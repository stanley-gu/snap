(* 

category:      Test
synopsis:      Basic reaction with two species in a 1-dimensional
compartment, where the species have only substance units.
componentTags: Compartment, Species, Reaction, Parameter 
testTags:      Amount, HasOnlySubstanceUnits
testType:      TimeCourse
levels:        2.1, 2.2, 2.3, 2.4, 3.1
generatedBy:   Numeric

The model contains one compartment called "compartment".  There are three
species named S1, S2 and S3 and two parameters named k1 and k2.
Compartment "compartment" is 1-dimensional.  Species S1, S2 and S3 are
declared to have only substance units.  The model contains two reactions
defined as:

[{width:30em,margin-left:5em}|  *Reaction*  |  *Rate*  |
| S1 + S2 -> S3 | $k1 * S1 * S2$  |
| S3 -> S1 + S2 | $k2 * S3$  |]

The initial conditions are as follows:

[{width:30em,margin-left:5em}|      |*Value*          |*Units*  |
|Initial amount of S1                |$          1.0$ |mole                      |
|Initial amount of S2                |$          2.0$ |mole                      |
|Initial amount of S3                |$          1.5$ |mole                      |
|Value of parameter k1               |$          7.5$ |mole^-1^ second^-1^ |
|Value of parameter k2               |$          0.3$ |second^-1^ |
|Length of compartment "compartment" |$            1$ |metre                     |]

The species have been declared as having substance units only. Thus, they 
must be treated as amounts where they appear in expressions.

*)

newcase[ "00224" ];

addCompartment[ compartment, spatialDimensions-> 1, size -> 1 ];
addSpecies[ S1, initialAmount -> 1.0, hasOnlySubstanceUnits->True ];
addSpecies[ S2, initialAmount -> 2.0, hasOnlySubstanceUnits->True ];
addSpecies[ S3, initialAmount -> 1.5, hasOnlySubstanceUnits->True ];
addParameter[ k1, value -> 7.5 ];
addParameter[ k2, value -> 0.3 ];
addReaction[ S1 + S2 -> S3, reversible -> False,
	     kineticLaw -> k1 * S1 * S2 ];
addReaction[ S3 -> S1 + S2, reversible -> False,
	     kineticLaw -> k2 * S3 ];

makemodel[]
