import Path from 'path';


export const RootDirectory = Path.resolve(__dirname, '../../');
export const ProjectDirectory = Path.join(RootDirectory, '../../');

export const BuildDirectory = {
    Root: Path.join(RootDirectory, 'build'),

    Development: {
        Root:       Path.join(RootDirectory, 'build', 'development'),
        Unpacked:   Path.join(RootDirectory, 'build', 'development', 'unpacked'),
        Hybrid:     Path.join(RootDirectory, 'build', 'development', 'hybrid')
    },

    Production: {
        Root:       Path.join(RootDirectory, 'build', 'production'),
        Unpacked:   Path.join(RootDirectory, 'build', 'production', 'unpacked'),
        Hybrid:     Path.join(RootDirectory, 'build', 'production', 'hybrid')
    }
};

export const CommonRequirements = [
    'whatwg-fetch'
];

export default {
    RootDirectory,
    ProjectDirectory,

    BuildDirectory,
    CommonRequirements
};
