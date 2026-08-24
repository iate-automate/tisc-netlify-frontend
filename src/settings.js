const settings = {

    global: {
        siteUrl: 'https://portal.traumainformedschools.co.uk',
        siteName: 'TISUK Portal',
        siteDescription: 'This is a dedicated online resource to support the work of TISUK practitioners.',
        siteImage: 'https://portal.traumainformedschools.co.uk/images/cover.jpg',
        siteContact: 'https://www.traumainformedschools.co.uk/contact',
    },
    resources: {
        "Handbook": {
            title: 'Delegate Handbook',
            url: '/resources/handbook',
            breadcrumb: [],
            live: true
        },
        "Courses": {
            title: 'My Courses',
            url: '/resources/courses',
            breadcrumb: [],
            live: false
        },
        "ARTE": {
            title: 'Alternative Response to Supporting Behaviour',
            url: '/resources/arte',
            breadcrumb: [
                {
                    url: '/resources/arte',
                    label: 'Search'
                },
                {
                    url: '/resources/arte/systems',
                    label: 'Systems'
                },
                {
                    url: '/resources/arte/behaviours',
                    label: 'Behaviours'
                }
            ],
            live: false
        }
    },
    nav: [
        {
            title: 'Resources',
            url: '/resources',
            protected: true,
            breadcrumb: [],
            live: true
        },
        {
            title: 'Account',
            url: '/account',
            protected: true,
            breadcrumb: [],
            live: true
        },
        {
            title: 'Contact',
            url: '/contact',
            protected: false,
            breadcrumb: [],
            live: true
        }
    ]
}

export default settings