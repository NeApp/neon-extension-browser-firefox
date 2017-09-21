import {isDefined} from './helpers';


export function generateDistributionName(version, options) {
    options = options || {};

    if(!isDefined(version)) {
        throw new Error('Missing required parameter: version');
    }

    // Build distribution name
    let tags = ['neon'];

    if(isDefined(options.type)) {
        tags.push(options.type);
    }

    tags.push(version);

    if(isDefined(options.environment)) {
        tags.push(options.environment);
    }

    return tags.join('-') + '.' + (options.extension || 'zip');
}
