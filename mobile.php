<?php
/**
 * Plugin Mobile for Roundcube
 *
 * Add new skin mobile to Roundcube
 *
 * Copyright (C) 2015  PNE Annuaire et Messagerie/MEDDE
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author PNE Annuaire et Messagerie/MEDDE
 * @license GNU GPLv3+
 *
 */
class mobile extends rcube_plugin {
  /**
   *
   * @var string
   */
  public $task = '.*';
  /**
   *
   * @var rcmail
   */
  private $rc;
  /**
   * List the identities of the current user
   *
   * @var array
   */
  private $identities;

  /**
   * Cookie life time : 200 days (60*60*24*200)
   */
  private static $expire_cookie = 17280000;

  private static $current_classes;

  /**
   * Plugin initialization
   *
   * @see rcube_plugin::init()
   */
  function init() {
    global $config;

    $this->rc = rcmail::get_instance();

    // Load the configuration of the plugin
    $this->load_config();

    // Add the task to switch skin
    $this->register_task('switch_skin');

    // Add the localization
    $this->add_texts('localization/', true);

    // Add the switch to desktop skin button
    $this->add_button(array('task' => 'switch_skin','data-ajax' => 'false', 'command' => 'switch_desktop','class' => 'button-switch_desktop ui-link ui-btn ui-corner-all ui-icon-desktop ui-btn-icon-left','innerclass' => 'button-inner','label' => 'mobile.desktop'), 'taskbar_mobile');
    // Add the switch to mobile skin button
    $this->add_button(array('task' => 'switch_skin','command' => 'switch_mobile','class' => 'about-link','classsel' => 'about-link button-selected','innerclass' => 'button-inner','label' => 'mobile.mobile'), 'topline-left');
    $this->register_action('switch_mobile', array($this,'switch_mobile'));
    $this->register_action('switch_desktop', array($this,'switch_desktop'));
    // Command
    $this->register_action('mobile.set_current_page', array($this,'set_current_page'));

    if ($this->rc->task == 'switch_skin') {
      return;
    }

    // Include jquery mobile stylesheets
    $skin = $this->rc->config->get('skin');

    // Are we using the mobile skin or not ?
    if ($this->api->output->type == 'html') {
      if ($this->isMobile() && strpos($skin, '_mobile') === false) {
        $skin = 'melanie2_larry_mobile';
        $this->rc->config->set('skin', $skin);
        $this->rc->output->set_env('skin', $skin);
        $this->rc->output->set_skin($skin);
      }
      elseif (! $this->isMobile() && strpos($skin, '_mobile') !== false) {
        $skin = str_replace('_mobile', '', $skin);
        $this->rc->config->set('skin', $skin);
        $this->rc->output->set_env('skin', $skin);
        $this->rc->output->set_skin($skin);
      }

      // Set env ismobile
      $this->rc->output->set_env('ismobile', $this->isMobile());
    }

    if ($this->isMobile()) {
      if (in_array($this->rc->task, $this->rc->config->get("mobile_tasks", array('mail', 'addressbook', 'settings')))) {
        // Include mobile.js script
        $this->include_script('js/mobile.js');
        $this->include_script('js/gesture.js');

        // Require jquery mobile
        $this->require_plugin('jquery_mobile');

        // Include custom stylesheet for jquery mobile
        $this->include_stylesheet('css/melanie2_larry_mobile.min.css');
        $this->include_stylesheet('css/jquery_mobile.css');

        // Add custom css
        if ($this->rc->config->get('custom_css', false)) {
          $this->include_stylesheet('css/' . $this->rc->config->get('custom_css'));
        }

        // Generate message list
        $this->add_hook('template_object_messages', array($this,'object_messages'));
        $this->add_hook('messages_list', array($this,'messages_list'));

        // Folder list
        $this->add_hook('folder_create', array($this,'folder_create'));
        $this->add_hook('folder_update', array($this,'folder_update'));
        $this->add_hook('folder_delete', array($this,'folder_delete'));

        // User photo
        $this->add_hook('template_object_userphoto', array($this,'userphoto'));

        // Config hook
        $this->add_hook('config_get', array($this,'config_get'));

        // Define the default values in session
        $_SESSION['sort_col'] = 'date';
        $_SESSION['sort_order'] = 'DESC';
        $_SESSION['page'] = 1;

        // Is enigma enable ?
        $this->rc->output->set_env('isenigma', in_array('enigma', $this->rc->plugins->active_plugins));
        $this->rc->output->set_env('contactphotourl', $this->rc->url(array('task' => 'addressbook', 'action' => 'photo')));
        $this->rc->output->set_env('showcontactsphotos', $this->rc->config->get('show_contacts_photos', true));

        if ($this->rc->task == 'mail' && empty($this->rc->action)) {
          // Add support for enigma
          if ($this->rc->output->get_env('isenigma')) {
            $this->rc->plugins->get_plugin('enigma')->load_ui();
            $this->rc->plugins->get_plugin('enigma')->ui->init();
            $this->rc->plugins->get_plugin('enigma')->ui->add_css();
            $this->rc->plugins->get_plugin('enigma')->ui->add_js();
          }
        }
        elseif ($this->rc->task == 'addressbook') {
          // add some labels to client
          $this->rc->output->add_label('deletecontactconfirm', 'copyingcontact', 'movingcontact', 'contactdeleting');

          if (isset($_GET['_orig_source'])) {
            // Redirect to avoid contact creation error
            header('Location: ?_task=addressbook&_source=' . rcube_utils::get_input_value('_orig_source', rcube_utils::INPUT_GET));
          }
        }
        elseif ($this->rc->task == 'settings'
            && $this->rc->action == 'edit-folder') {
          // add some labels to client
          $this->rc->output->add_label('deletefolderconfirm');
        }
      }
    }
  }

  /**
   * Convert the message list to ul and li
   *
   * @param array $args
   * @return array
   */
  public function object_messages($args) {
    $args['content'] = '<ul id="messagelist" class="records-table messagelist touch" data-role="listview"></ul>';
    return $args;
  }

  /**
   * Add mobile_text in messages list
   *
   * @param array $args
   * @return array
   */
  public function messages_list($args) {
    if (isset($args['messages'])) {
      foreach ($args['messages'] as $message) {
        $address = rcube_mime::decode_address_list($message->from, null, true);
        $from = "NNN";
        if (isset($address[1])) {
          if (isset($address[1]['name'])) {
            $from = $address[1]['name'];
          }
          elseif (isset($address[1]['mailto'])) {
            $from = $address[1]['mailto'];
          }
        }
        // Remove specials chars
        $from = str_replace(array(' ','~','"',"'",'!','>'), '', $from);
        $from = strtoupper($from);
        $message->mobile_text = substr($from, 0, 3);
        $message->mobile_class = $this->get_mobile_class($message->mobile_text);
      }
    }
    return $args;
  }

  /**
   * Reload page if create folder
   *
   * @param array $args
   * @return array
   */
  public function folder_create($args) {
    $folder = $args['record'];
    if ($this->rc->storage->create_folder($folder['name'], $folder['subscribe'])) {
      $this->rc->output->show_message('foldercreated', 'confirmation');
    }
    $args['abort'] = true;
    return $args;
  }

  /**
   * Reload page if delete folder
   *
   * @param array $args
   * @return array
   */
  public function folder_update($args) {
    $folder = $args['record'];
    if ($this->rc->task == 'settings' && $folder['oldname'] != $folder['name']) {
      $updated = $this->rc->storage->rename_folder($folder['oldname'], $folder['name']);
      $args['abort'] = true;
      if ($updated) {
        $this->rc->output->show_message('folderupdated', 'confirmation');
        $this->rc->output->set_env('folder', $folder['name']);
      }
    }
    return $args;
  }

  /**
   * Reload page if rename folder
   *
   * @param array $args
   * @return array
   */
  public function folder_delete($args) {
    $deleted = $this->rc->storage->delete_folder($args['name']);
    // #1488692: update session
    if ($deleted && $_SESSION['mbox'] === $mbox) {
      $this->rc->session->remove('mbox');
    }
    if ($deleted) {
       $this->rc->output->show_message('folderdeleted', 'confirmation');
       $this->rc->output->send();
    }
    $args['abort'] = true;
    return $args;
  }

  /**
   *
   * @param string $text
   */
  private function get_mobile_class($text) {
    $mobile_classes = array('green','blue','yellow','grey','red','orange','brown','purple');
    if (! isset(self::$current_classes))
      self::$current_classes = array();
    $class = "grey";
    if (isset(self::$current_classes[$text])) {
      $class = self::$current_classes[$text];
    }
    else {
      // $key = rand(0, count($mobile_classes));
      $key = (ord($text[0]) + ord($text[1]) + ord($text[2])) % count($mobile_classes);
      if (isset($mobile_classes[$key])) {
        $class = $mobile_classes[$key];
        self::$current_classes[$text] = $class;
      }
    }
    return $class;
  }

  /**
   * Modify the user configuration to adapt to mobile skin
   *
   * @param array $args
   */
  public function config_get($args) {
    switch ($args['name']) {
      // Liste des colonnes affichées
      case 'list_cols' :
        $args['result'] = array('status','from','date','subject','attachment','flag','mobile_text','mobile_class','labels');
        break;
      case 'dont_override' :
        if (! is_array($args['result']))
          $args['result'] = array();
        $args['result'][] = 'list_cols';
        break;
      // Nombre de mails à retourner
      case 'mail_pagesize' :
        $args['result'] = 25;
        break;
      // Pas de paneau de preview
      case 'preview_pane' :
        $args['result'] = false;
        break;
      case 'skin' :
        $args['result'] = 'melanie2_larry_mobile';
        break;
      case 'autoexpand_threads' :
        $args['result'] = 1;
        break;
      case 'ismobile' :
        $args['result'] = $this->isMobile();
        break;
      case 'date_format' :
        $args['result'] = 'Y-m-d';
        break;
      case 'layout':
        $args['result'] = 'mobile';
        break;
    }
    return $args;
  }

  /**
   * Show user photo
   *
   * @param array $attrib
   * @return string
   */
  function userphoto($args) {
    $photo_img = $this->rc->url(array('_task' => 'addressbook','_action' => 'photo','_email' => $this->rc->output->current_username(array())));

    $args['content'] = html::img(array('src' => $photo_img));

    return $args;
  }

  /**
   * Switch to the desktop skin
   */
  public function switch_desktop() {
    setcookie('roundcube_skin', 'desktop', self::$expire_cookie + time());
    $this->rc->output->redirect(array('_task' => 'mail'));
  }

  /**
   * Switch to the mobile skin
   */
  public function switch_mobile() {
    setcookie('roundcube_skin', 'mobile', self::$expire_cookie + time());
    $this->rc->output->redirect(array('_task' => 'mail'));
  }

  /**
   * Are we using the mobile skin
   *
   * @return boolean
   */
  public function isMobile() {
    $useragent = $_SERVER['HTTP_USER_AGENT'];
    $force_mobile = isset($_COOKIE['roundcube_skin']) && $_COOKIE['roundcube_skin'] == 'mobile';
    $force_desktop = isset($_COOKIE['roundcube_skin']) && $_COOKIE['roundcube_skin'] == 'desktop';
    $mobile_skin = $this->rc->config->get('skin') == 'melanie2_larry_mobile';
    return $mobile_skin || ! $force_desktop && ($force_mobile || preg_match('/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i', $useragent) || preg_match('/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i', substr($useragent, 0, 4)));
  }

  /**
   * **** COMMANDS *****
   */
  /**
   * Unset current page
   */
  public function set_current_page() {
    $_SESSION['page'] = 1;
    $result = array('action' => 'plugin.set_current_page');
    echo json_encode($result);
    exit();
  }
}