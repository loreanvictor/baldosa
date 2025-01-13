alter table tiles
    alter column title set default '',
    drop constraint tiles_title_check;
