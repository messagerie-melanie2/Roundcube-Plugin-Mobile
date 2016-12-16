mobile
======

Mobile Plugin for Roundcube 1.2.3

Presentation
------------

Plugin for adding the ability of switching between desktop skin and mobile skin. There is an automatic switch with the user-agent of the browser and a manual switch with two buttons (Desktop view and Mobile view)

Its needs the melanie2_larry_mobile skin and the jquery_mobile plugin


Version
-------

Mobile Melanie2 Skin 0.4.7


Author
------

PNE Annuaire et Messagerie/MEDDE


Installation
------------

Works on Roundcube 1.2.3

You need to add melanie2_larry_mobile skin (https://github.com/messagerie-melanie2/roundcube_skin_melanie2_larry_mobile) in the Roundcube skins folder, and jquery_mobile plugin (https://github.com/messagerie-melanie2/roundcube_jquery_mobile) in plugins folder

Rename the folder to "mobile" and add it to your Roundcube instance/plugins directory. Then edit Roundcube config.inc.php file and add "mobile" to the $config['plugins'] array.

For an installation with plugins manager you can follow the Roundcube Team's how-to : https://roundcubeinbox.wordpress.com/2016/04/26/roundcube-for-mobile-devices/


Attention
---------

You should only activate "mobile" plugin in config file, not the "jquery_mobile" plugin or you will have displays trouble in desktop view. jquery_mobile plugin is automatically activated by the mobile plugin when needed.


Plugins
-------

"plugins" directory provides melanie2_larry_mobile skin for supported plugins. Take the melanie2_mobile skin folder and put it in your plugin skins folder. For kolab calendar plugin, you'll have to use this repo : https://github.com/messagerie-melanie2/Roundcube-Plugin-Calendar


Issues
------

Before opening an issue, make sure to use last releases of plugin (https://github.com/messagerie-melanie2/Roundcube-Plugin-Mobile/releases/latest) and skin (https://github.com/messagerie-melanie2/Roundcube-Skin-Melanie2-Larry-Mobile/releases/latest). Thank you.
