// ======================================================
// Smart Expert Router
// ======================================================

const coder = require("../prompts/coder");
const teacher = require("../prompts/teacher");
const agriculture = require("../prompts/agriculture");
const safari = require("../prompts/safari");
const bible = require("../prompts/bible");
const health = require("../prompts/health");
const business = require("../prompts/business");
const general = require("../prompts/general");

function chooseExpert(message = "") {

    const text = message.toLowerCase();

    if (/(html|css|javascript|js|typescript|react|next|node|express|python|java|php|sql|mongodb|firebase|api|json|github|git|linux|terminal|bug|debug|compile|software|website|web|login|signup|dashboard|frontend|backend|code|coding|function|class|variable)/i.test(text)) {

        return coder;

    }

    if (/(teach|lesson|study|school|homework|assignment|math|mathematics|physics|chemistry|biology|photosynthesis|history|geography|english|kiswahili|formula|calculate|explain|define)/i.test(text)) {

        return teacher;

    }

    if (/(farm|farmer|crop|maize|rice|beans|cassava|banana|coffee|tea|cotton|soil|fertilizer|goat|cow|pig|chicken|livestock|poultry|harvest|seed|agriculture)/i.test(text)) {

        return agriculture;

    }

    if (/(safari|tour|tourism|park|serengeti|ngorongoro|ruaha|mikumi|wildlife|lion|elephant|zebra|giraffe|hippo|rhino|cheetah|camping|hiking)/i.test(text)) {

        return safari;

    }

    if (/(bible|jesus|god|holy spirit|church|pray|prayer|verse|scripture|gospel|acts|genesis|psalm|proverbs|romans|faith|christian)/i.test(text)) {

        return bible;

    }

    if (/(doctor|hospital|medicine|health|disease|infection|virus|bacteria|malaria|fever|headache|nutrition|exercise|fitness|blood|heart|pain|treatment|symptom)/i.test(text)) {

        return health;

    }

    if (/(business|money|profit|income|salary|investment|market|marketing|customer|finance|bank|entrepreneur|startup|company|shop|sell|buy)/i.test(text)) {

        return business;

    }

    return general;

}

module.exports = chooseExpert;