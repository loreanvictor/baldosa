alter table tiles
    alter column title drop default,
    add constraint tiles_title_check check ( length(title) > 0 );
